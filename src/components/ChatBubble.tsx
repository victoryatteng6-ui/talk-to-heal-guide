import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string | ContentPart[];
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  const renderContent = () => {
    if (typeof content === "string") {
      return isUser ? (
        content
      ) : (
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }
    // Multimodal content (user with image attachments)
    return (
      <div className="space-y-2">
        {content.map((part, i) =>
          part.type === "image_url" ? (
            <img
              key={i}
              src={part.image_url.url}
              alt="Uploaded medical image"
              className="max-h-64 rounded-lg border border-border object-cover"
              loading="lazy"
            />
          ) : (
            <p key={i} className="whitespace-pre-wrap">{part.text}</p>
          )
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-chat-user text-chat-user-foreground" : "bg-chat-bot text-chat-bot-foreground"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-chat-user text-chat-user-foreground rounded-tr-sm"
            : "bg-chat-bot text-chat-bot-foreground rounded-tl-sm"
        }`}
      >
        {renderContent()}
      </div>
    </motion.div>
  );
}
