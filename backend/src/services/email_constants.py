app_name = "Wakil"
support_email = "support@example.com"
user_name = "{user_name}"  # Placeholder for user name

onboarding_subject = f"Welcome to {app_name}! Let's Get Started 🚀"

onboarding_html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {app_name}!</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px;">
        <h1 style="color: #007bff;">Welcome {user_name} to {app_name}!</h1>
        <p>Hello {user_name},</p>
        <p>We're thrilled to have you on board! Now that you're all set up, here are some of the amazing features you can explore:</p>
        
        <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 10px;">
                <strong>AI Agent Creation:</strong> Easily create and customize AI agents tailored to your needs.
            </li>
            <li style="margin-bottom: 10px;">
                <strong>Multi-User Sessions:</strong> Set up and manage sessions with other users and your agents for seamless collaboration.
            </li>
            <li style="margin-bottom: 10px;">
                <strong>Real-Time Interactions:</strong> Engage with your agents and users in real-time for dynamic and interactive experiences.
            </li>
            <li style="margin-bottom: 10px;">
                <strong>Advanced Analytics:</strong> Monitor and analyze agent performance and user interactions to optimize your experience.
            </li>
        </ul>

        <p>If you have any questions, feel free to <a href="mailto:{support_email}" style="color: #007bff;">reach out to us</a> at any time. We're here to help!</p>

        <p>Happy exploring!</p>
        <p>The {app_name} Team</p>

        <footer style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
            <p>&copy; 2024 {app_name}, All Rights Reserved.</p>
            <p>Built with ❤️ by 20-year-old dreamer</p>
        </footer>
    </div>
</body>
</html>
"""
