import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending transaction receipt (Mock Email Service)
  app.post("/api/send-receipt", (req, res) => {
    const { recipientEmail, senderName, amount, commission, transactionId } = req.body;
    
    console.log(`[EMAIL SERVICE] Sending receipt to ${recipientEmail}`);
    
    // In a real app, you would use nodemailer or a service like SendGrid here.
    // For now, we simulate the 'amazing' email logic.
    
    const emailHtml = `
      <div style="background-color: #000; color: #fff; font-family: sans-serif; padding: 40px; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 40px; font-weight: 900; letter-spacing: -2px;">Mada</h1>
          <p style="color: #666; text-transform: uppercase; letter-spacing: 4px; font-size: 10px; margin-top: 5px;">Premium Financial Enclave</p>
        </div>
        
        <div style="background-color: #111; padding: 30px; border-radius: 15px; border: 1px solid #222;">
          <h2 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 15px;">Transaction Receipt</h2>
          
          <div style="margin-top: 20px;">
            <p style="color: #888; font-size: 12px; margin-bottom: 5px;">Sender</p>
            <p style="font-weight: bold; font-size: 16px;">${senderName}</p>
          </div>
          
          <div style="margin-top: 15px; display: flex; justify-content: space-between;">
            <div>
              <p style="color: #888; font-size: 12px; margin-bottom: 5px;">Amount Received</p>
              <p style="font-weight: bold; font-size: 24px; color: #4ade80;">$${amount}</p>
            </div>
            <div style="text-align: right;">
              <p style="color: #888; font-size: 12px; margin-bottom: 5px;">Commission Fee</p>
              <p style="font-weight: bold; font-size: 14px; color: #ef4444;">$${commission}</p>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dotted #333;">
            <p style="color: #555; font-size: 10px;">Transaction ID: ${transactionId}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #444; font-size: 12px;">This is a secure automated notification from Mada Bank.</p>
        </div>
      </div>
    `;

    // We respond as if it was sent
    res.json({ 
      success: true, 
      message: "Email receipt generated successfully",
      preview: emailHtml
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
