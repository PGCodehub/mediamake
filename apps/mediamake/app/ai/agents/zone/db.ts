import { ObjectId } from 'mongodb';
import { InstrumentalMusicPrompt } from './instrumental/promptGen';
import { getDatabase } from '@/lib/mongodb';

interface BaseMusicPrompt {
  audioUrl?: string;
  htmlUrl?: string;
}

export interface MusicPrompts extends InstrumentalMusicPrompt, BaseMusicPrompt {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export const getMusicPromptsCollection = async () => {
  const db = await getDatabase();
  return db.collection<MusicPrompts>('musicPrompts');
};
