import { AwsRegion, RenderMediaOnLambdaOutput } from '@remotion/lambda/client';
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from '@remotion/lambda/client';
import { DISK, RAM, REGION, SITE_NAME, TIMEOUT } from '../../../../config.mjs';
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { CrudHash } from '@microfox/db-upstash';
import { RenderRequest } from '@/lib/render-history';

export const POST = async (req: NextRequest) => {
  try {
    const { id, inputProps, isDownloadable, fileName, codec } =
      await req.json();

    if (
      !process.env.AWS_ACCESS_KEY_ID &&
      !process.env.REMOTION_AWS_ACCESS_KEY_ID
    ) {
      throw new TypeError(
        'Set up Remotion Lambda to render videos. See the README.md for how to do so.',
      );
    }
    if (
      !process.env.AWS_SECRET_ACCESS_KEY &&
      !process.env.REMOTION_AWS_SECRET_ACCESS_KEY
    ) {
      throw new TypeError(
        'The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.',
      );
    }

    console.log(process.env.REMOTION_AWS_REGION || REGION);
    console.log('Composition is', id);
    console.log('Codec is', codec);
    console.log(
      'Function name is',
      speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
    );

    const result = await renderMediaOnLambda({
      codec: codec || 'h264',
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }), //remotion-render-4-0-347-mem3000mb-disk10240mb-240sec
      region: (process.env.REMOTION_AWS_REGION || REGION) as AwsRegion,
      serveUrl: SITE_NAME, // https://remotionlambda-useast2-xjv1ee2a1g.s3.us-east-2.amazonaws.com/sites/mediamake
      composition: id,
      inputProps: inputProps,
      //framesPerLambda: null,
      downloadBehavior: {
        type: isDownloadable ? 'download' : 'play-in-browser',
        fileName: isDownloadable ? fileName || 'video.mp4' : null,
      },
      //   metadata: {

      //   }
    });

    if (req.headers.get('x-client-id')) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL ?? 'https://ignore',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ?? 'ignore',
      });
      const renderHistoryStore = new CrudHash<RenderRequest>(
        redis,
        'render_history',
      );
      await renderHistoryStore.set(
        req.headers.get('x-client-id') + '-' + result.renderId,
        {
          id: req.headers.get('x-client-id') + '-' + result.renderId,
          fileName: fileName,
          codec: codec,
          composition: id,
          status: 'rendering',
          createdAt: new Date().toISOString(),
          inputProps: inputProps,
          bucketName: result.bucketName,
          renderId: result.renderId,
          isDownloadable: isDownloadable,
        },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { type: 'error', message: (err as Error).message },
      {
        status: 500,
      },
    );
  }
};
