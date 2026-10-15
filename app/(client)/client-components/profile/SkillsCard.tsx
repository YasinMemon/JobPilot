"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { User } from "@/types/user";
import InfoCard from "../ui/InfoCard";

const chipClass =
  "rounded-full border bg-muted px-4 py-2 text-sm font-medium";

export default function SkillsCard({
  user,
  isEditing,
  setProfile,
}: {
  user: User | null;
  isEditing: boolean;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
}) {
  const [input, setInput] = useState("");
  const skills = user?.skills ?? [];

  const updateSkills = (next: string[]) =>
    setProfile({ ...user, skills: next } as User);

  const addSkill = () => {
    const skill = input.trim();
    if (!skill) return;
    const exists = skills.some((s) => s.toLowerCase() === skill.toLowerCase());
    if (!exists) updateSkills([...skills, skill]);
    setInput("");
  };

  return (
    <InfoCard title="Skills">
      {isEditing ? (
        <div className="space-y-3">
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className={`${chipClass} flex items-center gap-2`}
                >
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() =>
                      updateSkills(skills.filter((s) => s !== skill))
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={input}
            placeholder="Type a skill and press Enter"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              } else if (e.key === "Backspace" && !input && skills.length) {
                updateSkills(skills.slice(0, -1));
              }
            }}
            onBlur={addSkill}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {skills.map((skill) => (
            <span key={skill} className={chipClass}>
              {skill}
            </span>
          ))}
        </div>
      )}
    </InfoCard>
  );
}
