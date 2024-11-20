import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PublishConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublishConfirmationDialog: React.FC<PublishConfirmationDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle>Publish Workflow</DialogTitle>
          <DialogDescription>
            Your workflow has been successfully published. Wanna give it a try?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
            <a href="/dashboard/sessions">
            <Button
            className='bg-transparent'
            variant={"outline"}
            >
                Try it!
            </Button>
            </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishConfirmationDialog;