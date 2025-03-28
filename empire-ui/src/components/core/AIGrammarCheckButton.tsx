"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, Ellipsis, SquarePen } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const useAIGrammerChecker = () => {
  const [isChecking, setIsChecking] = React.useState(false);
  const [correction, setCorrection] = React.useState<string>("");
  const correctionRef = React.useRef<HTMLDivElement>(null);

  const handleSummarize = async (selectedText: string) => {
    if (!selectedText) {
      return;
    }

    setIsChecking(true);
    setCorrection("");

    try {
      const response = await fetch("/api/buttons/AIGrammarCheckButton", {
        method: "POST",
        body: `correct the grammar and style of the following text: ${selectedText}`,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = (await reader?.read()) ?? {
          done: true,
          value: new Uint8Array(),
        };
        if (done) break;
        const chunk = decoder.decode(value);
        setCorrection((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Error corerecting text:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      correctionRef.current &&
      !correctionRef.current.contains(event.target as Node)
    ) {
      setCorrection("");
    }
  };

  React.useEffect(() => {
    if (correction) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [correction]);

  return { isChecking, correction, handleSummarize, correctionRef };
};

interface AIGrammarCheckButtonProps {
  className?: string;
  buttonClassName?: string;
  tooltipClassName?: string;
  correctionClassName?: string;
  textSelector?: string;
}

const AIGrammarCheckButton: React.FC<AIGrammarCheckButtonProps> = ({
  className,
  buttonClassName,
  tooltipClassName,
  correctionClassName,
  textSelector,
  ...props
}) => {
  const { isChecking, correction, handleSummarize, correctionRef } =
    useAIGrammerChecker();

  const handleClick = async () => {
    const selectedText = window.getSelection()?.toString();
    const textElement = document.querySelector(textSelector as string);
    await handleSummarize(
      selectedText ? selectedText : textElement?.textContent!
    );
  };

  return (
    <div className={cn("relative", className)}>
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <motion.button
              onClick={handleClick}
              whileTap={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className={cn(
                "p-3 bg-white text-zinc-800 border-2 border-black rounded-full transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-700",
                buttonClassName
              )}
              disabled={isChecking}
            >
              {isChecking ? (
                <Ellipsis className="h-6 w-6 animate-ping" />
              ) : (
                <BookOpenCheck className="h-6 w-6" />
              )}
              <span className="sr-only">Check selected text</span>
            </motion.button>
          </Tooltip.Trigger>
          <Tooltip.Content
            className={cn(
              "bg-zinc-950 text-white px-4 py-2 rounded-xl shadow-lg text-sm",
              "transition-opacity duration-200 ease-in-out",
              tooltipClassName
            )}
            sideOffset={8}
            {...props}
          >
            Check selected text
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
      {correction && (
        <div
          ref={correctionRef}
          className={cn(
            "mt-4 p-4 rounded-lg shadow-sm border max-w-full",
            "overflow-x-auto break-words text-sm",
            "md:text-base",
            correctionClassName
          )}
        >
          <h3 className="text-lg font-semibold mb-2">Correction:</h3>
          <p>{correction}</p>
        </div>
      )}
    </div>
  );
};

export { AIGrammarCheckButton };
