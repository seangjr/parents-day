# Figma mobile-1-welcome (9:8)

```tsx
const imgShadowImage = "http://localhost:3845/assets/c9057a8ea26480496fb7bea4dfc85aa553d147b9.png";
const imgVector = "http://localhost:3845/assets/3fcfcaae5017a7348e64c5f199f6319205604321.svg";
const imgVector1 = "http://localhost:3845/assets/8e0d2d496e1dd936c594f66de0a682dd2c2c40d8.svg";
const imgIosSignal = "http://localhost:3845/assets/c92bfb3e4c60e8198bbb7363f1f2a8c5182dc4f9.svg";
const imgIosWifiSignal = "http://localhost:3845/assets/6d85ffb66d6307f1ff2a5dfe76d5ac64f7e775cf.svg";
const imgIosBatteryFull = "http://localhost:3845/assets/afd38d9d9350b70bf8a304e1e3b9f20374d2ff25.svg";
const imgVector2 = "http://localhost:3845/assets/8bfc25033281c07ba3c9500fb9ab0cdd39903ad0.svg";

export default function Mobile1Welcome() {
  return (
    <div className="bg-[#10150f] content-stretch flex flex-col items-start justify-between relative size-full" data-node-id="9:8" data-name="Mobile 1 — Welcome">
      <div className="absolute contents left-0 top-0" data-node-id="9:9" data-name="background">
        <div className="absolute h-[796.796px] left-[67.4px] top-[47.2px] w-[227.533px]" data-node-id="9:10" data-name="shadow-image">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <img alt="" className="absolute max-w-none object-cover size-full" src={imgShadowImage} />
            <div className="absolute bg-[rgba(16,21,15,0.6)] inset-0" />
          </div>
        </div>
        <div className="absolute bg-[rgba(0,0,0,0)] h-[796.796px] left-[67.4px] top-[47.2px] w-[227.533px]" data-node-id="9:11" data-name="grain" />
        <div className="absolute flex h-[201.32px] items-center justify-center left-0 top-0 w-[347.183px]" data-node-id="9:12">
          <div className="flex-none rotate-[23.44deg] scale-y-97 skew-x-[14.04deg]">
            <div className="h-[55.459px] relative w-[368.538px]" data-name="Vector">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[105.798px] items-center justify-center left-[38.23px] top-[734.21px] w-[351.769px]" data-node-id="9:13">
          <div className="flex-none rotate-[-8.06deg] skew-x-[-4.96deg]">
            <div className="h-[56.511px] relative w-[352.196px]" data-name="Vector">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector1} />
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex h-[44px] items-center justify-between px-[24px] relative shrink-0 w-full" data-node-id="9:14" data-name="status-bar">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold'] font-semibold leading-[normal] not-italic relative shrink-0 text-[#f0f4a6] text-[14px] whitespace-nowrap" data-node-id="9:15">
          9:41
        </p>
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="9:16" data-name="Frame">
          <div className="relative shrink-0 size-[20px]" data-node-id="9:192" data-name="ios-signal">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIosSignal} />
          </div>
          <div className="relative shrink-0 size-[20px]" data-node-id="9:198" data-name="ios-wifi-signal">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIosWifiSignal} />
          </div>
          <div className="h-[20px] relative shrink-0 w-[28px]" data-node-id="9:204" data-name="ios-battery-full">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIosBatteryFull} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[48px] items-start justify-center p-[32px] relative shrink-0 w-full" data-node-id="9:20" data-name="Frame">
        <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0" data-node-id="9:21" data-name="Frame">
          <div className="h-[20px] relative shrink-0 w-[60px]" data-node-id="9:22" data-name="Vector">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector2} />
          </div>
          <p className="[word-break:break-word] font-['Roboto_Condensed:Bold'] font-bold leading-[normal] relative shrink-0 text-[#f0f4a6] text-[12px] uppercase whitespace-nowrap" data-node-id="9:23">
            PARENTS DAY 2026
          </p>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-col font-['Cedarville_Cursive:Regular'] items-center leading-[normal] not-italic relative shrink-0 text-[#f0f4a6] text-center w-full" data-node-id="9:24" data-name="Frame">
          <p className="mb-[-20px] relative shrink-0 text-[120px] w-full" data-node-id="9:25">
            Love
          </p>
          <p className="relative shrink-0 text-[80px] w-full" data-node-id="9:26">
            Revealed
          </p>
        </div>
        <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[1.6] min-w-full not-italic relative shrink-0 text-[#f7f1c8] text-[16px] text-center w-[min-content]" data-node-id="9:27">
          Discover how you and your family give and receive love. Answer 5 quick questions and join the live family wall.
        </p>
      </div>
      <div className="content-stretch flex flex-col gap-[24px] items-start p-[32px] relative shrink-0 w-full" data-node-id="9:28" data-name="Frame">
        <div className="bg-[#f0f4a6] content-stretch flex h-[56px] items-center justify-center relative rounded-[4px] shrink-0 w-full" data-node-id="9:29" data-name="btn-primary">
          <p className="[word-break:break-word] font-['Roboto_Condensed:Bold'] font-bold leading-[normal] relative shrink-0 text-[#050705] text-[16px] uppercase whitespace-nowrap" data-node-id="9:30">
            Begin
          </p>
        </div>
        <p className="[text-underline-position:from-font] [word-break:break-word] decoration-from-font decoration-solid font-['Inter:Regular'] font-normal leading-[normal] not-italic relative shrink-0 text-[#f0f4a6] text-[14px] text-center underline w-full" data-node-id="9:31">
          Already have a family code?
        </p>
        <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[normal] not-italic relative shrink-0 text-[#a8ad82] text-[12px] text-center w-full" data-node-id="9:32">
          Takes about 1 minute
        </p>
      </div>
    </div>
  );
}
SUPER CRITICAL: The generated React+Tailwind code MUST be converted to match the target project's technology stack and styling system.
1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens
2. Convert React syntax to the target framework/library
3. Transform all Tailwind classes to the target styling system while preserving exact visual design
4. Follow the project's existing patterns and conventions
DO NOT install any Tailwind as a dependency unless the user instructs you to do so.

Node ids have been added to the code as data attributes, e.g. `data-node-id="1:2"`.
Image assets are stored on a localhost server. Clients can use these images directly in code as a way to view the image assets the same way they would other remote servers. Images and SVGs will be stored as constants, e.g. const image = 'http://localhost:3845/assets/10c13ac1a228a365cb98a0064b1d5afbc84887b2.png' These constants will be used in the code as the source for the image, e.g. <img src={image} /> This is true for both images and SVGs, so you can use the same approach for both types of assets.
IMPORTANT: After you call this tool, you MUST call get_screenshot to get a screenshot of the node for context.
```
