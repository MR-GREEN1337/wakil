import { NextResponse } from "next/server";

export async function POST(request: Request){
    const body = await request.json();

    const {token} = body;

    const secretKey = process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY;

    const verificationResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
        method: 'POST',
        headers: {
            "Content-type":"application/x-www-form-urlencoded"
        }
    });

    const verification = await verificationResponse.json();
    alert(verification.response)
    if (verification.response && verification.score > 0.5){
        return NextResponse.json({
            success:true, score:verification.score
        });
    }
    else {
        return NextResponse.json({
            success: false,
            score: verification.score,
            errorCodes:verification["error_codes"]
        });
    }
}