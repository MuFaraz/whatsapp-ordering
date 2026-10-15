import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Do my customers need to download an app?",
    a: "No. Customers scan the QR code with their phone camera and the menu opens in their browser. No app, no sign-up.",
  },
  {
    q: "How do WhatsApp orders work?",
    a: "When a customer taps “Order on WhatsApp”, WhatsApp opens with a ready-made message listing their items, quantities, prices, order type and notes. The customer presses Send, and you reply to confirm. Orders are not sent automatically and aren't confirmed until you reply.",
  },
  {
    q: "Do I need WhatsApp Business or the WhatsApp API?",
    a: "No. Any WhatsApp number works, including the free WhatsApp Business app (useful for quick replies and labels). We don't use the paid WhatsApp Business API.",
  },
  {
    q: "Do you take a commission on orders?",
    a: "No. You pay a flat monthly fee. Orders and customers are yours.",
  },
  {
    q: "Can I change prices or mark items as sold out?",
    a: "Yes, from your dashboard at any time. Changes appear on your menu instantly and you don't need to reprint your QR code.",
  },
  {
    q: "Can customers pay online?",
    a: "Not yet. Payment is handled the way you do today (cash, card machine or bank transfer) when you confirm the order.",
  },
  {
    q: "Does it work without a custom domain?",
    a: "Yes. Your menu gets its own link on our platform, and your QR code points to it. If you'd like a full custom website, we offer that as a separately quoted service.",
  },
];

export function Faq() {
  return (
    <Accordion type="single" collapsible className="mx-auto w-full max-w-3xl">
      {faqs.map((faq, i) => (
        <AccordionItem key={faq.q} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
