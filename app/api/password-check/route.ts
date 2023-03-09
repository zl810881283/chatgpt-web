
const USER_PASSWORD = process.env.USER_PASSWORD ?? "ChatGPT"

export async function POST(req: Request): Promise<Response> {
    const { password } = (await req.json()) as { password: string };

    const result = password == USER_PASSWORD

    return new Response(JSON.stringify({ result }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

