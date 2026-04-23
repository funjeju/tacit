import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
    }
    try {
      await adminAuth.verifyIdToken(authHeader.slice(7));
    } catch {
      return NextResponse.json({ error: '인증에 실패했어요.' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    if (!audioFile) {
      return NextResponse.json({ error: '오디오 파일이 없어요.' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: 'STT 서비스를 사용할 수 없어요.' }, { status: 503 });
    }

    // Whisper API 호출
    const fd = new FormData();
    fd.append('file', audioFile, 'recording.webm');
    fd.append('model', 'whisper-1');
    fd.append('language', 'ko');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: fd,
    });

    if (!whisperRes.ok) {
      console.error('[Whisper error]', await whisperRes.text());
      return NextResponse.json({ error: '음성 인식에 실패했어요.' }, { status: 500 });
    }

    const data = await whisperRes.json();
    return NextResponse.json({ text: data.text ?? '' });
  } catch (error) {
    console.error('[API /interview/transcribe]', error);
    return NextResponse.json({ error: '음성 처리 중 오류가 발생했어요.' }, { status: 500 });
  }
}
