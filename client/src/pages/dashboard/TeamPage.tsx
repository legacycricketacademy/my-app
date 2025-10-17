import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PlayersPage from "@/pages/players-page";

export default function TeamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);

  // Check for add=true query parameter and open dialog
  useEffect(() => {
    const addParam = searchParams.get('add');
    if (addParam === 'true') {
      setShowAddPlayerDialog(true);
      // Remove the query parameter from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  return (
    <PlayersPage />
  );
}
