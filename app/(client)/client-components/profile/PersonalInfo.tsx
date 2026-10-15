import { User } from "@/types/user";
import InfoCard from "../ui/InfoCard";
import DatePicker from "@/components/ui/date-picker";

export default function PersonalInfo({
  user,
  isEditing,
  setProfile,
}: {
  user: User | null;
  isEditing: boolean;
  setProfile: (profile: User | null) => void;
}) {
  return (
    <InfoCard title="Personal Information">
      <div className="grid gap-5 md:grid-cols-2">
        {isEditing ? (
          <>
            <EditableField
              label="Full Name"
              value={user?.fullName || ""}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  fullName: newValue,
                } as User);
              }}
            />
            <EditableField
              label="Email"
              value={user?.email || ""}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  email: newValue,
                } as User);
              }}
            />
            <EditableField
              label="Phone"
              value={user?.phone || ""}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  phone: newValue,
                } as User);
              }}
            />
            <SelectableField
              label="Gender"
              value={user?.gender || ""}
              options={["Male", "Female", "Other"]}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  gender: newValue,
                } as User);
              }}
            />
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <DatePicker
                max={new Date().toISOString().split("T")[0]}
                value={toDateInputValue(user?.dateOfBirth)}
                onChange={(newValue) => {
                  setProfile({
                    ...user,
                    dateOfBirth: newValue,
                  } as User);
                }}
              />
            </div>
            <EditableField
              label="Country"
              value={user?.country || ""}
              onChange={(newValue) => {
                setProfile({
                  ...user,
                  country: newValue,
                } as User);
              }}
            />
          </>
        ) : (
          <>
            <Field
              label="Full Name"
              value={user?.fullName || "Not specified"}
            />
            <Field label="Email" value={user?.email || "Not specified"} />
            <Field label="Phone" value={user?.phone || "Not specified"} />
            <Field label="Gender" value={user?.gender || "Not specified"} />
            <Field
              label="Date of Birth"
              value={formatDate(user?.dateOfBirth)}
            />
            <Field label="Country" value={user?.country || "Not specified"} />
          </>
        )}
      </div>
    </InfoCard>
  );
}

function toDateInputValue(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

function formatDate(value?: string) {
  if (!value) return "Not specified";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>

      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

export function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

export function SelectableField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (newValue: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">-- Select {label} --</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

