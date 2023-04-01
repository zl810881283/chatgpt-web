import { UserType } from "@/app/types";

const USER_PASSWORD = process.env.USER_PASSWORD ?? "ChatGPT"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChatGPTAdmin"

export async function POST(req: Request): Promise<Response> {
    const { password } = (await req.json()) as { password: string };

    let userType: UserType = UserType.anonymous
    if (password == USER_PASSWORD) {
        userType = UserType.common
    }
    if (password == ADMIN_PASSWORD) {
        userType = UserType.admin
    }

    return new Response(JSON.stringify({ userType }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

