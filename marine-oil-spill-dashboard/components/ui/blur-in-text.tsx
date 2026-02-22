'use client';
import { motion } from "framer-motion";

export const BlurInText = ({
    text = "Blur In Effect",
    className = "",
    highlightText = "",
    highlightClassName = ""
}: {
    text?: string,
    className?: string,
    highlightText?: string,
    highlightClassName?: string
}) => {
    const words = text.split(' ');
    let globalCharIndex = 0;

    return (
        <h1 className={`text-4xl md:text-6xl font-bold text-center leading-[1.2] pb-2 ${className}`}>
            {words.map((word, wordIndex) => {
                const isLastWord = wordIndex === words.length - 1;
                const chars = word.split('');

                const charElements = chars.map((char) => {
                    const currentIndex = globalCharIndex++;

                    let isHighlighted = false;
                    let localHighlightIndex = 0;
                    let totalHighlightChars = 1;

                    if (highlightText && text.includes(highlightText)) {
                        const startIndex = text.indexOf(highlightText);
                        const endIndex = startIndex + highlightText.length;

                        if (currentIndex >= startIndex && currentIndex < endIndex) {
                            isHighlighted = true;
                            localHighlightIndex = currentIndex - startIndex;
                            totalHighlightChars = highlightText.length;
                        }
                    }

                    return (
                        <motion.span
                            key={currentIndex}
                            initial={{
                                opacity: 0,
                                filter: "blur(10px)"
                            }}
                            animate={{
                                opacity: 1,
                                filter: "blur(0px)"
                            }}
                            transition={{
                                delay: currentIndex * 0.05,
                                duration: 0.8,
                                ease: "easeOut"
                            }}
                            className={`inline-block ${isHighlighted ? highlightClassName : ""}`}
                            style={isHighlighted ? {
                                backgroundSize: `${totalHighlightChars * 100}%`,
                                backgroundPosition: `${(localHighlightIndex / Math.max(1, totalHighlightChars - 1)) * 100}% 0`
                            } : {}}
                        >
                            {char}
                        </motion.span>
                    );
                });

                if (!isLastWord) {
                    globalCharIndex++; // increment for the space
                }

                return (
                    <span key={wordIndex}>
                        <span className="inline-block whitespace-nowrap">
                            {charElements}
                        </span>
                        {!isLastWord && ' '}
                    </span>
                );
            })}
        </h1>
    );
};
