import { User } from "@/types/user";
import InfoCard from "../ui/InfoCard";
import { EditableField } from "./PersonalInfo";

export default function SkillsCard({
  user,
  isEditing,
  setProfile,
}: {
  user: User | null;
  isEditing: boolean;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
}) {
  return (
    <InfoCard title="Skills">
      {isEditing ? (
        <EditableField
          label="Skills"
          value={user?.skills?.join(", ") || ""}
          onChange={(newValue) => {
            setProfile({
              ...user,
              skills: newValue.split(", ").map((s) => s.trim()),
            } as User);
          }}
        />
      ) : (
        <div className="flex flex-wrap gap-3">
          {user?.skills?.map((skill) => (
            <span
              key={skill}
              className="rounded-full border bg-muted px-4 py-2 text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </InfoCard>
  );
}
