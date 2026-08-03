import { User } from "@/types/user";
import InfoCard from "../ui/InfoCard";
import { EditableField, SelectableField } from "./PersonalInfo";

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 font-medium">{value}</p>
  </div>
);

export default function ProfessionalInfo({
  user,
  isEditing,
  setProfile,
}: {
  user: User | null;
  isEditing: boolean;
  setProfile: (profile: User | null) => void;
}) {
  return (
    <InfoCard title="Professional Information">
      <div className="grid gap-5 md:grid-cols-2">
        {isEditing ? (
          <EditableField
            label="Headline"
            value={user?.currentJobTitle || ""}
            onChange={(newValue) => {
              setProfile({
                ...user,
                currentJobTitle: newValue,
              } as User);
            }}
          />
        ) : (
          <Field
            label="Headline"
            value={user?.currentJobTitle || "Not specified"}
          />
        )}
        {isEditing ? (
          <SelectableField
            label="Experience"
            value={user?.yearsOfExperience || ""}
            options={["Less than 1 year", "1-3", "3-5", "5-10", "10+"]}
            onChange={(newValue) => {
              setProfile({
                ...user,
                yearsOfExperience: newValue,
              } as User);
            }}
          />
        ) : (
          <Field
            label="Experience"
            value={user?.yearsOfExperience || "Not specified"}
          />
        )}
        {isEditing ? (
          <EditableField
            label="Current Company"
            value={user?.currentCompany || ""}
            onChange={(newValue) => {
              setProfile({
                ...user,
                currentCompany: newValue,
              } as User);
            }}
          />
        ) : (
          <Field
            label="Current Company"
            value={user?.currentCompany || "Not specified"}
          />
        )}
        {isEditing ? (
          <EditableField
            label="Current Role"
            value={user?.currentRole || ""}
            onChange={(newValue) => {
              setProfile({
                ...user,
                currentRole: newValue,
              } as User);
            }}
          />
        ) : (
          <Field
            label="Current Role"
            value={user?.currentRole || "Not specified"}
          />
        )}
        {isEditing ? (
          <SelectableField
            label="Preferred Job Type"
            value={user?.prefferredJobType || ""}
            options={["Full-time", "Part-time", "Contract", "Internship"]}
            onChange={(newValue) => {
              setProfile({
                ...user,
                prefferredJobType: newValue,
              } as User);
            }}
          />
        ) : (
          <Field
            label="Preferred Job Type"
            value={user?.prefferredJobType || "Not specified"}
          />
        )}
        {isEditing ? (
          <SelectableField
            label="Work Mode"
            value={user?.workMode || ""}
            options={["Remote", "On-site", "Hybrid"]}
            onChange={(newValue) => {
              setProfile({
                ...user,
                workMode: newValue,
              } as User);
            }}
          />
        ) : (
          <Field label="Work Mode" value={user?.workMode || "Not specified"} />
        )}
        {isEditing ? (
          <SelectableField
            label="Notice Period"
            value={user?.noticePeriod || ""}
            options={["Immediate", "15 days", "30 days", "60 days", "90 days"]}
            onChange={(newValue) => {
              setProfile({
                ...user,
                noticePeriod: newValue,
              } as User);
            }}
          />
        ) : (
          <Field
            label="Notice Period"
            value={user?.noticePeriod || "Not specified"}
          />
        )}
        {isEditing ? (
          <EditableField
            label="Expected Salary"
            value={user?.expectedSalary || ""}
            onChange={(newValue) => {
              setProfile({
                ...user,
                expectedSalary: newValue,
              } as User);
            }}
          />
        ) : (
          <Field
            label="Expected Salary"
            value={user?.expectedSalary || "Not specified"}
          />
        )}
      </div>
    </InfoCard>
  );
}
