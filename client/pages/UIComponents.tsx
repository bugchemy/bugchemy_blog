import { useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Slider } from "@/components/ui/slider";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const ComponentSection = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <Card className="mb-8">
    <CardHeader>
      <CardTitle className="text-2xl">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-6">{children}</CardContent>
  </Card>
);

const ComponentShowcase = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <div className="border rounded-lg p-6 bg-muted/30">
    <h4 className="text-sm font-semibold mb-4 text-muted-foreground">{name}</h4>
    <div className="flex flex-wrap gap-4 items-center">{children}</div>
  </div>
);

export default function UIComponents() {
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [switchEnabled, setSwitchEnabled] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");
  const [progressValue, setProgressValue] = useState(40);
  const [sliderValue, setSliderValue] = useState([50]);
  const [calendarDate, setCalendarDate] = useState<Date>();
  const [selectedTab, setSelectedTab] = useState("preview");

  return (
    <Layout>
      <SEO
        title="UI Components Library"
        description="A comprehensive showcase of all UI components available in the project."
      />

      <div className="container py-8 md:py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">UI Components Library</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A comprehensive demonstration of all available UI components in the project. This page helps visualize
            component variations and states for enhancement and customization.
          </p>
        </div>

        {/* Buttons Section */}
        <ComponentSection
          title="Buttons"
          description="Button component with different variants and sizes"
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Variants</h4>
              <ComponentShowcase name="Default">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </ComponentShowcase>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Sizes</h4>
              <ComponentShowcase name="Size Variations">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🎯</Button>
              </ComponentShowcase>
            </div>

            <div>
              <h4 className="font-semibold mb-3">States</h4>
              <ComponentShowcase name="States">
                <Button disabled>Disabled</Button>
                <Button>Normal State</Button>
              </ComponentShowcase>
            </div>
          </div>
        </ComponentSection>

        {/* Badges Section */}
        <ComponentSection
          title="Badges"
          description="Badge component for labels and tags"
        >
          <div>
            <h4 className="font-semibold mb-3">Variants</h4>
            <ComponentShowcase name="Badge Variants">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </ComponentShowcase>
          </div>
        </ComponentSection>

        {/* Cards Section */}
        <ComponentSection
          title="Cards"
          description="Card component for content containers"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the card content. You can place any content inside a card.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Another Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Cards are great for organizing content into distinct sections.</p>
              </CardContent>
            </Card>
          </div>
        </ComponentSection>

        {/* Input Components Section */}
        <ComponentSection
          title="Input Components"
          description="Text inputs, textareas, and related controls"
        >
          <div className="space-y-6">
            <div>
              <Label htmlFor="input-demo">Text Input</Label>
              <Input id="input-demo" placeholder="Enter some text..." className="mt-2" />
            </div>

            <div>
              <Label htmlFor="textarea-demo">Textarea</Label>
              <Textarea id="textarea-demo" placeholder="Enter multi-line text..." className="mt-2" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="mt-2" />
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Selection Components Section */}
        <ComponentSection
          title="Selection Components"
          description="Checkboxes, radio buttons, switches, and toggles"
        >
          <div className="space-y-8">
            <div>
              <h4 className="font-semibold mb-4">Checkbox</h4>
              <ComponentShowcase name="Checkbox States">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="checkbox-demo"
                    checked={checkboxChecked}
                    onCheckedChange={setCheckboxChecked}
                  />
                  <Label htmlFor="checkbox-demo">Accept terms and conditions</Label>
                </div>
              </ComponentShowcase>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Radio Group</h4>
              <ComponentShowcase name="Radio Options">
                <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option1" id="radio-1" />
                    <Label htmlFor="radio-1">Option 1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option2" id="radio-2" />
                    <Label htmlFor="radio-2">Option 2</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option3" id="radio-3" />
                    <Label htmlFor="radio-3">Option 3</Label>
                  </div>
                </RadioGroup>
              </ComponentShowcase>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Switch</h4>
              <ComponentShowcase name="Switch States">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="switch-demo"
                    checked={switchEnabled}
                    onCheckedChange={setSwitchEnabled}
                  />
                  <Label htmlFor="switch-demo">
                    {switchEnabled ? "Enabled" : "Disabled"}
                  </Label>
                </div>
              </ComponentShowcase>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Toggle</h4>
              <ComponentShowcase name="Toggle Button">
                <Toggle>Toggle me</Toggle>
                <Toggle pressed={true}>Pressed</Toggle>
              </ComponentShowcase>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Toggle Group</h4>
              <ComponentShowcase name="Toggle Group">
                <ToggleGroup type="single" defaultValue="left">
                  <ToggleGroupItem value="left">Left</ToggleGroupItem>
                  <ToggleGroupItem value="center">Center</ToggleGroupItem>
                  <ToggleGroupItem value="right">Right</ToggleGroupItem>
                </ToggleGroup>
              </ComponentShowcase>
            </div>
          </div>
        </ComponentSection>

        {/* Select Component */}
        <ComponentSection
          title="Select"
          description="Dropdown select component"
        >
          <div className="max-w-xs">
            <Label htmlFor="select-demo">Choose an option</Label>
            <Select>
              <SelectTrigger id="select-demo" className="mt-2">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
                <SelectItem value="option4">Option 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ComponentSection>

        {/* Tabs Section */}
        <ComponentSection
          title="Tabs"
          description="Tabbed content navigation"
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preview Tab</CardTitle>
                  <CardDescription>This is the preview tab content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>You can display component previews here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="code" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Code Tab</CardTitle>
                  <CardDescription>Code examples and snippets</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded overflow-auto text-sm">
{`<Tabs value={selectedTab} onValueChange={setSelectedTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content</TabsContent>
</Tabs>`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="docs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documentation Tab</CardTitle>
                  <CardDescription>Related documentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Tabs help organize content into different views.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ComponentSection>

        {/* Accordion Section */}
        <ComponentSection
          title="Accordion"
          description="Collapsible accordion component"
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern and works with keyboard navigation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that you can customize to match your design.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can it be animated?</AccordionTrigger>
              <AccordionContent>
                Yes. The component supports smooth animations and transitions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentSection>

        {/* Alert Section */}
        <ComponentSection
          title="Alert"
          description="Alert messages for important information"
        >
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                This is a standard alert message to inform users about important information.
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-500">
              <AlertTitle className="text-blue-600">Note</AlertTitle>
              <AlertDescription>
                You can customize the styling of alerts for different purposes.
              </AlertDescription>
            </Alert>

            <Alert className="border-red-500">
              <AlertTitle className="text-red-600">Error</AlertTitle>
              <AlertDescription>
                This is how you can display error messages to users.
              </AlertDescription>
            </Alert>
          </div>
        </ComponentSection>

        {/* Progress & Slider Section */}
        <ComponentSection
          title="Progress & Slider"
          description="Progress bars and slider controls"
        >
          <div className="space-y-8">
            <div>
              <h4 className="font-semibold mb-4">Progress Bar</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Loading Progress</span>
                    <span className="text-sm text-muted-foreground">{progressValue}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
                <Button
                  onClick={() => setProgressValue(Math.min(progressValue + 20, 100))}
                  size="sm"
                >
                  Increment Progress
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Slider</h4>
              <div className="space-y-4 max-w-xs">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Value: {sliderValue[0]}</span>
                  </div>
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Calendar Section */}
        <ComponentSection
          title="Calendar"
          description="Calendar date picker component"
        >
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={setCalendarDate}
              className="rounded-md border"
            />
          </div>
        </ComponentSection>

        {/* Breadcrumb Section */}
        <ComponentSection
          title="Breadcrumb"
          description="Navigation breadcrumb component"
        >
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/components">Components</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>UI Library</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        </ComponentSection>

        {/* Dialog Section */}
        <ComponentSection
          title="Dialog"
          description="Modal dialog component"
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a dialog box. You can place any content inside it.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p>Dialog content goes here.</p>
              </div>
            </DialogContent>
          </Dialog>
        </ComponentSection>

        {/* Popover Section */}
        <ComponentSection
          title="Popover"
          description="Floating popover component"
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-semibold leading-none">Popover Content</h4>
                <p className="text-sm text-muted-foreground">
                  This is a popover component. It can contain any content and appears relative to the trigger element.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </ComponentSection>

        {/* Dropdown Menu Section */}
        <ComponentSection
          title="Dropdown Menu"
          description="Dropdown menu component"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ComponentSection>

        {/* HoverCard Section */}
        <ComponentSection
          title="Hover Card"
          description="Hover card component for displaying additional information"
        >
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">Hover over me</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Hover Card Title</h4>
                <p className="text-sm">
                  This card appears when you hover over the trigger element.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </ComponentSection>

        {/* Sheet Section */}
        <ComponentSection
          title="Sheet"
          description="Sliding sheet/sidebar component"
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
                <SheetDescription>
                  This is a sheet component. It slides in from the side.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <p>Sheet content goes here.</p>
              </div>
            </SheetContent>
          </Sheet>
        </ComponentSection>

        {/* Separator Section */}
        <ComponentSection
          title="Separator"
          description="Visual separator component"
        >
          <div className="space-y-4">
            <div>
              <p className="mb-3">Text above separator</p>
              <Separator />
              <p className="mt-3">Text below separator</p>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span>Left</span>
                <Separator orientation="vertical" className="h-6" />
                <span>Right</span>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Skeleton Section */}
        <ComponentSection
          title="Skeleton"
          description="Skeleton loading component"
        >
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
        </ComponentSection>

        {/* AspectRatio Section */}
        <ComponentSection
          title="Aspect Ratio"
          description="Component for maintaining aspect ratio"
        >
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=281&fit=crop"
              alt="Aspect ratio example"
              className="rounded-md object-cover w-full h-full"
            />
          </AspectRatio>
        </ComponentSection>

        {/* ScrollArea Section */}
        <ComponentSection
          title="Scroll Area"
          description="Scrollable area component"
        >
          <ScrollArea className="h-48 w-full rounded-md border p-4">
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="pb-4">
                  <h4 className="font-semibold mb-2">Item {i + 1}</h4>
                  <p className="text-sm text-muted-foreground">
                    This is scrollable content. You can scroll through this area to see more items.
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </ComponentSection>
      </div>
    </Layout>
  );
}
