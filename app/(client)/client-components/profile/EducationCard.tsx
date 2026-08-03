import { User } from "@/types/user";
import InfoCard from "../ui/InfoCard";
import { EditableField } from "./PersonalInfo";

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 font-medium">{value}</p>
  </div>
);

export default function EducationCard({
  user,
  isEditing,
  setProfile,
}: {
  user: User | null;
  isEditing: boolean;
  setProfile: React.Dispatch<React.SetStateAction<User | null>>;
}) {
  return (
    <InfoCard title="Education">
      <div className="grid gap-5 md:grid-cols-2">
        {isEditing ? (
          <>
            <EditableField
              label="Degree"
              value={user?.education?.degree || ""}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  education: {
                    ...user?.education,
                    degree: newValue,
                  },
                } as User);
              }}
            />
            <EditableField
              label="University"
              value={user?.education?.university || ""}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  education: {
                    ...user?.education,
                    university: newValue,
                  },
                } as User);
              }}
            />
            <EditableField
              label="Passing Year"
              value={user?.education?.passingYear || ""}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  education: {
                    ...user?.education,
                    passingYear: newValue,
                  },
                } as User);
              }}
            />
            <EditableField
              label="CGPA"
              value={user?.education?.cgpa || ""}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  education: {
                    ...user?.education,
                    cgpa: newValue,
                  },
                } as User);
              }}
            />
          </>
        ) : (
          <>
            <Field
              label="Degree"
              value={user?.education?.degree || "Not specified"}
            />
            <Field
              label="University"
              value={user?.education?.university || "Not specified"}
            />
            <Field
              label="Passing Year"
              value={user?.education?.passingYear || "Not specified"}
            />
            <Field
              label="CGPA"
              value={user?.education?.cgpa || "Not specified"}
            />
          </>
        )}
      </div>
    </InfoCard>
  );
}
