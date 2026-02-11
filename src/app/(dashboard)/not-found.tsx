import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center space-y-4">
        <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Page introuvable</h1>
        <p className="text-muted-foreground">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  )
}
