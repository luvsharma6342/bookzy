/**
 * Meta WhatsApp Cloud API Helper Client
 */

export interface WhatsAppSendResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Clean phone number to WhatsApp compatible format (only digits, including country code, no "+" prefix)
 */
export function cleanWhatsAppPhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  // If it's a 10 digit number, default to Indian country code (91)
  if (clean.length === 10) {
    clean = "91" + clean;
  }
  return clean;
}

/**
 * Sends a pre-approved template message to a customer.
 * Uses Meta Graph API v19.0.
 */
export async function sendWhatsAppTemplate(
  phoneNumberId: string,
  permanentToken: string,
  toPhone: string,
  templateName: string,
  params: string[]
): Promise<WhatsAppSendResult> {
  if (!phoneNumberId || !permanentToken || !toPhone || !templateName) {
    return {
      success: false,
      error: "Missing required WhatsApp connection parameters"
    };
  }

  const cleanPhone = cleanWhatsAppPhone(toPhone);

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "en"
      },
      components: params && params.length > 0 ? [
        {
          type: "body",
          parameters: params.map(val => ({
            type: "text",
            text: val
          }))
        }
      ] : []
    }
  };

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    console.log(`Sending WhatsApp Template [${templateName}] to [${cleanPhone}] via endpoint [${url}]...`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${permanentToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error("Meta WhatsApp API error response:", JSON.stringify(resData));
      return {
        success: false,
        error: resData.error?.message || `Meta API responded with status ${response.status}`
      };
    }

    console.log("WhatsApp message sent successfully:", JSON.stringify(resData));
    return { success: true, data: resData };
  } catch (err: any) {
    console.error("WhatsApp send network failure:", err);
    return {
      success: false,
      error: err.message || "Network transmission failed"
    };
  }
}
