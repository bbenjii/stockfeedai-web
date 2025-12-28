import SymbolSearch from "@/components/symbol-search";
import Logo from "@/components/logo";
import { Menu } from 'lucide-react';
import { User } from 'lucide-react';
import {Button} from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTrigger,
} from "@/components/ui/sheet"

export default function Navbar({className=""}: { className?: string}) {
    
    const navOptions = [
        {name: "Home", href: "/"},
        {name: "About", href: "/"},
        {name: "API", href: "/"},
    ]
    
    function MobileNav(){
        
        return (
            <Sheet>
                <SheetTrigger>
                    <Menu/>
                </SheetTrigger>
                <SheetContent side={"left"} className={""}>
                    <SheetHeader>
                        {/*<Logo/>*/}
                    </SheetHeader>
                    <div className={"grid grid-cols-1"}>
                        {navOptions.map((option) => (
                            <a href={option.href} className={" px-4 py-2 hover:bg-background-2 text-lg"}>{option.name}</a>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        )
    }
    return (
        <div className={"py-1 mb-2 max-w-300 mx-auto " + className }>
            <div className={"flex items-center justify-between"}>
                {/*<Menu/>*/}
                <div className={"lg:hidden"}>
                  <MobileNav/>  
                </div>
                <a href={"/"}>
                    <Logo/>
                </a>
                
                
                <Button className={"bg-background-2 text-white rounded-2xl"}>
                    <User/>
                </Button>
            </div>
            <div className={"lg:w150"}>
                <SymbolSearch/>
            </div>
            <div className={"hidden lg:block"}>
                <div className={"flex p-2 gap-4"}>
                    {navOptions.map((option) => (
                        <a href={option.href} className={" px-4 py-2 hover:bg-background-2 rounded-2xl "}>{option.name}</a>
                    ))}
                </div>
            </div>
            
            {/*<div className={"flex h-20 p-3 border-none items-center gap-5"}>*/}
            {/*    <a href={"/"} className={"border p-6 rounded-2xl cursor-pointer"}>*/}
            {/*        <CardTitle>STOCKFEED.AI</CardTitle>*/}
            {/*    </a>*/}
            {/*    <div className={"w-50"}>*/}
            {/*        <SymbolSearch/>*/}
            {/*    </div>*/}
            {/*</div>*/}
        </div>
    )
}