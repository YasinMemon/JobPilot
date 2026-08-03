import { Button } from "@/components/ui/button";

export default function ProfileHeader({
  isEditing,
  setIsEditing,
  handleUpdate,
}: {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleUpdate: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border p-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>

        <p className="text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      {isEditing ? (
        <div>
          <Button
            onClick={() => setIsEditing(false)}
            variant="outline"
            className="bg-transparent text-primary hover:bg-transparent hover:text-primary cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-primary text-white hover:bg-primary/90 cursor-pointer ml-2"
          >
            Save Changes
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setIsEditing(true)}
          className="bg-primary text-white hover:bg-primary/90 cursor-pointer"
        >
          Edit Profile
        </Button>
      )}
    </div>
  );
}
