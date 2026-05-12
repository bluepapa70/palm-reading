import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다.'));
  },
});

const PALM_READING_PROMPT = `당신은 수십 년의 경험을 가진 전문 손금 전문가입니다.
제공된 손바닥 이미지를 보고 한국 전통 손금 해석법에 따라 상세하게 분석해 주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "overall": "전체적인 손의 인상과 운명에 대한 종합 해석 (3~4문장)",
  "lines": {
    "생명선": {
      "name": "생명선",
      "emoji": "❤️",
      "interpretation": "생명선에 대한 상세 해석 (2~3문장). 건강, 생명력, 활력에 대해 설명하세요.",
      "score": 1에서 10 사이의 숫자
    },
    "감정선": {
      "name": "감정선",
      "emoji": "💕",
      "interpretation": "감정선에 대한 상세 해석 (2~3문장). 연애운, 감정, 인간관계에 대해 설명하세요.",
      "score": 1에서 10 사이의 숫자
    },
    "두뇌선": {
      "name": "두뇌선",
      "emoji": "🧠",
      "interpretation": "두뇌선에 대한 상세 해석 (2~3문장). 지성, 사고방식, 창의성에 대해 설명하세요.",
      "score": 1에서 10 사이의 숫자
    },
    "운명선": {
      "name": "운명선",
      "emoji": "⭐",
      "interpretation": "운명선에 대한 상세 해석 (2~3문장). 직업운, 성공, 삶의 방향에 대해 설명하세요.",
      "score": 1에서 10 사이의 숫자
    },
    "태양선": {
      "name": "태양선",
      "emoji": "☀️",
      "interpretation": "태양선에 대한 상세 해석 (2~3문장). 명예, 재물운, 인기에 대해 설명하세요.",
      "score": 1에서 10 사이의 숫자
    },
    "결혼선": {
      "name": "결혼선",
      "emoji": "💍",
      "interpretation": "결혼선에 대한 상세 해석 (2~3문장). 결혼 시기, 배우자 인연에 대해 설명하세요.",
      "score": 1에서 10 사이의 숫자
    }
  },
  "fortune": "이번 달 운세와 조언 (2~3문장)",
  "luckyItems": {
    "color": "행운의 색",
    "number": 행운의 숫자(정수),
    "direction": "행운의 방향"
  }
}

만약 이미지가 손바닥 사진이 아니라면, 다음과 같이 응답하세요:
{"error": "손바닥 이미지를 업로드해 주세요. 명확한 손바닥 사진이 필요합니다."}`;

router.post('/', upload.single('palmImage'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '이미지를 업로드해 주세요.' });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'high',
              },
            },
            { type: 'text', text: PALM_READING_PROMPT },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const content = JSON.parse(response.choices[0].message.content);

    if (content.error) {
      return res.status(400).json({ success: false, error: content.error });
    }

    if (!content.lines || !content.overall) {
      return res.status(500).json({ success: false, error: '분석 결과를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.' });
    }

    return res.json({ success: true, data: content });
  } catch (err) {
    console.error('Palm analysis error:', err);
    return res.status(500).json({ success: false, error: '분석 중 오류가 발생했습니다. 다시 시도해 주세요.' });
  }
});

export default router;
