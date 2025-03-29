import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 서버 사이드 전용 환경 변수 사용
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, sourceLang } = req.body;
    const targetLang = sourceLang === 'ko' ? 'th' : 'ko';
    const prompt = `Translate the following text from ${sourceLang === 'ko' ? 'Korean' : 'Thai'} to ${targetLang === 'ko' ? 'Korean' : 'Thai'}:\n\n${text}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a professional translator between Korean and Thai. Translate the text naturally while preserving the meaning accurately. Only return the translated text without any additional explanation or notes." 
        },
        { role: "user", content: prompt }
      ],
      model: "gpt-3.5-turbo",
    });

    const translatedText = completion.choices[0]?.message?.content?.trim() || '';
    res.status(200).json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: '번역 중 오류가 발생했습니다.' });
  }
} 