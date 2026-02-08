import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Plus, Minus, Truck, Car, Bike } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const mapBg = PlaceHolderImages.find(p => p.id === "map-bg-1");

export function MapWidget() {
  return (
    <Card className="shadow-sm overflow-hidden flex flex-col dark:bg-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Ubicación Flota</CardTitle>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-muted-foreground">En vivo</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative min-h-[300px]">
        {mapBg ? (
          <Image 
            src={mapBg.imageUrl}
            fill
            alt={mapBg.description}
            className="object-cover"
            data-ai-hint={mapBg.imageHint}
          />
        ) : <div className="bg-muted w-full h-full"></div> }
        <div className="absolute top-1/4 left-1/4">
          <div className="relative group">
            <Button size="icon" variant="outline" className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm border-white shadow-lg hover:scale-110 transition-transform">
                <Truck className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>
        <div className="absolute top-1/2 left-2/3">
           <div className="relative group">
             <Button size="icon" variant="outline" className="w-8 h-8 rounded-full bg-green-500/20 backdrop-blur-sm border-white shadow-lg hover:scale-110 transition-transform">
                <Car className="w-4 h-4 text-green-600" />
            </Button>
          </div>
        </div>
        <div className="absolute bottom-1/3 left-1/3">
           <div className="relative group">
            <Button size="icon" variant="outline" className="w-8 h-8 rounded-full bg-orange-500/20 backdrop-blur-sm border-white shadow-lg hover:scale-110 transition-transform">
                <Bike className="w-4 h-4 text-orange-600" />
            </Button>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button size="icon" variant="outline" className="w-8 h-8 bg-card/80 hover:bg-card">
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline" className="w-8 h-8 bg-card/80 hover:bg-card">
            <Minus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
