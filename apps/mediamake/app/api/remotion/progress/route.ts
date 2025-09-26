import {
  speculateFunctionName,
  AwsRegion,
  getRenderProgress,
} from '@remotion/lambda/client';
import { DISK, RAM, REGION, TIMEOUT } from '../../../../config.mjs';
import { NextRequest, NextResponse } from 'next/server';
import { renderRequestDB } from '@/lib/render-mongodb';

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const bucketName = searchParams.get('bucketName');
    const id = searchParams.get('id');

    console.log('bucketName', bucketName);
    console.log('id', id);
    if (!bucketName || !id) {
      return NextResponse.json(
        { error: 'Missing bucketName or id parameters' },
        { status: 400 },
      );
    }

    const renderProgress = await getRenderProgress({
      bucketName: bucketName,
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      region: REGION as AwsRegion,
      renderId: id,
    });

    const clientId = req.headers.get('x-client-id');
    if (clientId) {
      await renderRequestDB.update(
        renderProgress.renderId,
        {
          progressData: renderProgress,
          status: renderProgress.fatalErrorEncountered
            ? 'failed'
            : renderProgress.done
              ? 'completed'
              : 'rendering',
          downloadUrl: renderProgress.outputFile as string,
          fileSize: renderProgress.outputSizeInBytes as number,
        },
        clientId,
      );
    }

    if (renderProgress.fatalErrorEncountered) {
      return NextResponse.json({
        type: 'error',
        message: renderProgress.errors[0].message,
        renderInfo: renderProgress,
      });
    }

    if (renderProgress.done) {
      return NextResponse.json({
        type: 'done',
        url: renderProgress.outputFile as string,
        size: renderProgress.outputSizeInBytes as number,
        renderInfo: renderProgress,
      });
    }

    return NextResponse.json({
      type: 'progress',
      progress: Math.max(0.03, renderProgress.overallProgress),
      renderInfo: renderProgress,
    });
  } catch (error) {
    console.error('Failed to get render progress:', error);
    return NextResponse.json(
      { error: 'Failed to get render progress' },
      { status: 500 },
    );
  }
};
