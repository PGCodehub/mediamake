import { AwsRegion, RenderMediaOnLambdaOutput } from '@remotion/lambda/client';
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from '@remotion/lambda/client';
import { DISK, RAM, REGION, SITE_NAME, TIMEOUT } from '../../../../config.mjs';
import { NextRequest, NextResponse } from 'next/server';
import { renderRequestDB } from '@/lib/render-mongodb';

export const POST = async (req: NextRequest) => {
  try {
    const {
      id,
      inputProps,
      isDownloadable,
      fileName,
      codec,
      audioCodec,
      renderType, // Added for unified interface
    } = await req.json();

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
    console.log('Audio Codec is', audioCodec);
    console.log('Render Type is', renderType);
    console.log(
      'Function name is',
      speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
    );

    const result = await renderMediaOnLambda({
      codec: codec ?? 'h264',
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }), //remotion-render-4-0-347-mem3000mb-disk10240mb-240sec
      region: (process.env.REMOTION_AWS_REGION || REGION) as AwsRegion,
      serveUrl: SITE_NAME, // https://remotionlambda-useast2-xjv1ee2a1g.s3.us-east-2.amazonaws.com/sites/mediamake
      composition: id ?? 'DataMotion',
      inputProps: inputProps,
      audioCodec: audioCodec ?? 'aac',
      //framesPerLambda: null,
      timeoutInMilliseconds: 280 * 1000,
      downloadBehavior: {
        type: isDownloadable ? 'download' : 'play-in-browser',
        fileName: isDownloadable ? fileName || 'video.mp4' : null,
      },
      //   metadata: {

      //   }
    });

    const clientId = req.headers.get('x-client-id');
    if (clientId) {
      await renderRequestDB.create({
        clientId,
        renderId: result.renderId,
        fileName: fileName || 'video.mp4',
        codec: codec || 'h264',
        composition: id ?? 'DataMotion',
        status: 'rendering',
        inputProps: inputProps,
        bucketName: result.bucketName,
        isDownloadable: isDownloadable,
        renderType: renderType || 'video',
      });
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
