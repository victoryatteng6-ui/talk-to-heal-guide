import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

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
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-chat-user text-chat-user-foreground rounded-tr-sm"
            : "bg-chat-bot text-chat-bot-foreground rounded-tl-sm"
        }`}
      >
        {isUser ? (
          content
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
