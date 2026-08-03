import { Globe } from "lucide-react";
import InfoCard from "../ui/InfoCard";
import { User } from "@/types/user";
import { EditableField } from "./PersonalInfo";

type SocialLinkKey = "portfolio" | "github" | "linkedin";

export default function SocialLinks({
  user,
  isEditing,
  setProfile,
}: {
  user: User | null;
  isEditing: boolean;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
}) {
  const links: { key: SocialLinkKey; label: string; value: string }[] = [
    {
      key: "portfolio",
      label: "Portfolio",
      value: user?.socialLinks?.portfolio || "",
    },
    {
      key: "github",
      label: "GitHub",
      value: user?.socialLinks?.github || "",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      value: user?.socialLinks?.linkedin || "",
    },
  ];

  return (
    <InfoCard title="Social Links">
      <div className="space-y-5">
        {links.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-4 rounded-xl border p-4"
          >
            <Globe className="h-6 w-6 shrink-0 text-primary" />

            <div className="w-full">
              {isEditing ? (
                <EditableField
                  label={item.label}
                  value={item.value}
                  onChange={(newValue) => {
                    setProfile({
                      ...user,
                      socialLinks: {
                        ...user?.socialLinks,
                        [item.key]: newValue,
                      },
                    } as User);
                  }}
                />
              ) : (
                <>
                  <p className="font-medium">{item.label}</p>
                  {item.value ? (
                    <a
                      href={`https://${item.value.replace("https://", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </InfoCard>
  );
}
