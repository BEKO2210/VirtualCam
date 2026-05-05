import { Edit3 } from 'lucide-react';
import { useResolvedSelection } from '@/lib/store';
import { CameraRig } from '@/components/rig/CameraRig';
import { Button } from '@/components/ui/button';

interface Props {
  onEdit: () => void;
}

export function RigView({ onEdit }: Props) {
  const { brand, camera, lens, lensMountKey, compat } = useResolvedSelection();
  return (
    <div className="space-y-2">
      <CameraRig
        brand={brand ? { brand: brand.brand, format: brand.format, mount: brand.mount } : null}
        camera={camera}
        lens={lens}
        lensMountKey={lensMountKey}
        compat={compat}
      />
      <div className="flex justify-center">
        <Button variant="secondary" size="sm" onClick={onEdit} className="gap-2">
          <Edit3 className="size-3.5" />
          Setup bearbeiten
        </Button>
      </div>
    </div>
  );
}
