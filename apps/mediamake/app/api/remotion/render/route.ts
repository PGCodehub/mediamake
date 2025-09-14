import { AwsRegion, RenderMediaOnLambdaOutput } from '@remotion/lambda/client';
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from '@remotion/lambda/client';
import { DISK, RAM, REGION, SITE_NAME, TIMEOUT } from '../../../../config.mjs';
import { RenderRequest } from '../helper';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (req: NextRequest) => {
  try {
    const { id, inputProps, fileName, codec } = await req.json();

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
      serveUrl: SITE_NAME, // https://remotionlambda-useast2-xjv1ee2a1g.s3.eu-east-2.amazonaws.com/sites/mediamake
      composition: id,
      inputProps: inputProps,
      framesPerLambda: 10,
      downloadBehavior: {
        type: 'download',
        fileName: fileName || 'video.mp4',
      },
      //   metadata: {

      //   }
    });
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
