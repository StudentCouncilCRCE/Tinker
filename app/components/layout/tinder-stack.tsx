import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { X, Heart } from "lucide-react";
import { Button } from "../ui/button";
import type { PublicProfile } from "~/utilities/types/profile.type";

interface TinderStackProps {
  users: PublicProfile[];
  onRightSwipe: (user: PublicProfile) => void;
  onLeftSwipe?: (user: PublicProfile) => void;
}

export function TinderStack({
  users,
  onRightSwipe,
  onLeftSwipe,
}: TinderStackProps) {
  const [index, setIndex] = useState(0);

  const currentUser = users[index];

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentUser) return;

    if (direction === "right") {
      onRightSwipe(currentUser);
    } else {
      onLeftSwipe?.(currentUser);
    }

    setIndex((prev) => prev + 1);
  };

  return (
    <div className="flex h-[90vh] w-full items-center justify-center">
      <AnimatePresence>
        {currentUser && (
          <motion.div
            key={currentUser.name}
            className="w-85"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 120) handleSwipe("right");
              if (info.offset.x < -120) handleSwipe("left");
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, x: 0 }}
          >
            <Card className="overflow-hidden shadow-lg p-0">
              {currentUser.image && (
                <img
                  src={currentUser.image}
                  alt={currentUser.name}
                  className="w-full max-h-[60vh] aspect-9/16 object-cover"
                />
              )}
              <CardContent className="space-y-2 p-4">
                <h2 className="text-xl font-semibold">{currentUser.name}</h2>
                {currentUser.bio && (
                  <p className="text-sm text-muted-foreground">
                    {currentUser.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="mt-4 flex justify-between px-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSwipe("left")}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button size="icon" onClick={() => handleSwipe("right")}>
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!currentUser && (
        <p className="text-muted-foreground">No more profiles</p>
      )}
    </div>
  );
}
