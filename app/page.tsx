import { FridgeItemsManager } from "@/components/fridge-items-manager"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <FridgeItemsManager />
      </div>
    </main>
  )
}
