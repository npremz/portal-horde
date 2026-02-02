"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { API_PERMISSIONS } from "@/lib/api-auth";
import type { ApiPermission } from "@/types/database";

interface KeyPermissionsProps {
  value: ApiPermission[];
  onChange: (permissions: ApiPermission[]) => void;
  disabled?: boolean;
}

export function KeyPermissions({
  value,
  onChange,
  disabled,
}: KeyPermissionsProps) {
  const handleToggle = (permission: ApiPermission) => {
    if (value.includes(permission)) {
      onChange(value.filter((p) => p !== permission));
    } else {
      onChange([...value, permission]);
    }
  };

  return (
    <div className="space-y-3">
      {API_PERMISSIONS.map((perm) => (
        <div key={perm.value} className="flex items-start space-x-3">
          <Checkbox
            id={perm.value}
            checked={value.includes(perm.value)}
            onCheckedChange={() => handleToggle(perm.value)}
            disabled={disabled}
          />
          <div className="grid gap-0.5 leading-none">
            <Label
              htmlFor={perm.value}
              className="text-sm font-medium cursor-pointer"
            >
              {perm.label}
            </Label>
            <p className="text-xs text-muted-foreground">{perm.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
