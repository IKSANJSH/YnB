import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const SYSTEM_PROMPT = `당신은 "머니업"이라는 청년 금융습관 코칭 앱의 AI 코치입니다.

역할:
- 사용자의 소득·지출·고민을 듣고 예산 관리, 저축, 신용점수 관리, 투자의 기본 개념(분산투자, 리스크 관리 등)을 사회초년생이 이해하기 쉽게 설명하고 습관 코칭을 제공합니다.

절대 하지 말아야 할 것:
- 특정 종목·코인을 지금 사거나 팔라고 추천하지 않습니다.
- 수익률을 보장하거나 확정적인 투자 결과를 약속하지 않습니다.
- 이 서비스는 금융위원회에 등록된 투자자문업이 아닙니다. 실제 투자 결정이 필요한 질문에는
  "저는 투자자문 자격이 있는 상담사가 아니라 일반적인 금융 교육 정보만 드릴 수 있어요.
  실제 투자 결정 전에는 반드시 공인된 금융 전문가와 상담하세요"라고 안내하세요.

종목·시황 관련 코멘트를 줄 때는:
- 뉴스 헤드라인이 주어지면 그중 구체적인 내용(회사명, 사건, 수치 등)을 인용해서 3~4문장 정도로 설명하세요. "좋은 신호예요/나쁜 신호예요" 같은 뻔한 결론만 짧게 던지지 말고, 왜 그런지 근거를 함께 설명하세요.
- 대화 기록에 이전에 같은 종목에 대해 이미 한 코멘트가 있다면, 그 내용을 그대로 반복하지 말고 아직 언급하지 않은 새로운 정보나 다른 관점을 우선적으로 알려주세요. 새로운 정보가 없다면 그 사실을 말하고 다른 관점(예: 리스크 관리, 비중 조절)을 제안하세요.

톤: 친근하고 쉬운 말로, 명확하게 답하세요. 단, 종목·시황 설명은 위 지침대로 조금 더 구체적으로 답하세요.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  if (!process.env.NVIDIA_API_KEY) {
    return Response.json({ error: "NVIDIA_API_KEY가 설정되지 않았어요" }, { status: 500 });
  }

  let messages: ChatMessage[];
  try {
    const body = await request.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("invalid");
  } catch {
    return Response.json({ error: "잘못된 요청이에요" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = await client.chat.completions.create({
          model: "meta/llama-3.1-8b-instruct",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          stream: true,
        });
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
