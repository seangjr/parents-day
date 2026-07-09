# Figma led-5-stats (9:1366)

```tsx
const imgShadowBase = "http://localhost:3845/assets/90f10290a2bcf3d74a6f390bd040911643758d89.png";
const imgLightRayTop = "http://localhost:3845/assets/6157de40357d2fbfd61c898b003b1d43e1d9be2c.svg";
const imgLightRayBottom = "http://localhost:3845/assets/deea6dbd6ac1a6c0cd7fa332333a453614e6cbc9.svg";
const imgVector = "http://localhost:3845/assets/acd96ea93a3d68f8db88bddd8a48164599bc27b8.svg";
const imgFrame = "http://localhost:3845/assets/5aa9a996e77b27653089a1b81cda220dc1fc022c.svg";

export default function Led5StatsOverlay() {
  return (
    <div className="bg-[#10150f] content-stretch flex items-start relative size-full" data-node-id="9:1366" data-name="LED 5 — Stats Overlay">
      <div className="absolute contents left-0 top-[-122.02px]" data-node-id="9:1367" data-name="background-textures">
        <div className="absolute h-[1080px] left-0 opacity-60 top-0 w-[1920px]" data-node-id="9:1368" data-name="shadow-base">
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            <img alt="" className="absolute max-w-none object-cover opacity-40 size-full" src={imgShadowBase} />
            <div className="absolute bg-[rgba(16,21,15,0.6)] inset-0" />
          </div>
        </div>
        <div className="absolute flex h-[490.55px] items-center justify-center left-0 top-[122px] w-[1162.575px]" data-node-id="9:1369">
          <div className="flex-none rotate-15 scale-y-97 skew-x-[13.9deg]">
            <div className="h-[180px] opacity-60 relative w-[1200px]" data-name="light-ray-top">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLightRayTop} />
            </div>
          </div>
        </div>
        <div className="absolute flex h-[322.013px] items-center justify-center left-[1003.5px] top-[799.98px] w-[1396.16px]" data-node-id="9:1370">
          <div className="-rotate-5 flex-none skew-x-[-4.57deg]">
            <div className="h-[200px] opacity-60 relative w-[1400px]" data-name="light-ray-bottom">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgLightRayBottom} />
            </div>
          </div>
        </div>
        <div className="absolute bg-[rgba(0,0,0,0)] h-[1080px] left-0 opacity-1 top-[-122.02px] w-[1920px]" data-node-id="9:1371" data-name="grain" />
      </div>
      <div className="absolute content-stretch flex flex-col gap-[12px] items-start left-0 pl-[80px] pt-[60px] top-0" data-node-id="9:1372" data-name="header-area">
        <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="9:1373" data-name="event-title">
          <div className="h-[20px] relative shrink-0 w-[60px]" data-node-id="9:1374" data-name="Vector">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector} />
          </div>
          <p className="[word-break:break-word] font-['Roboto_Condensed:Bold'] font-bold leading-[normal] relative shrink-0 text-[#f0f4a6] text-[18px] uppercase whitespace-nowrap" data-node-id="9:1375">
            PARENTS DAY 2026
          </p>
        </div>
        <p className="[word-break:break-word] font-['Cedarville_Cursive:Regular'] leading-[normal] not-italic relative shrink-0 text-[#f0f4a6] text-[96px] whitespace-nowrap" data-node-id="9:1376">
          Love Revealed
        </p>
      </div>
      <div className="absolute bottom-[60px] content-stretch flex flex-col gap-[20px] items-center right-[80px]" data-node-id="9:1377" data-name="qr-callout">
        <div className="bg-[#f0f4a6] content-stretch flex items-center justify-center p-[20px] relative rounded-[24px] shrink-0 size-[240px]" data-node-id="9:1378" data-name="qr-card">
          <div className="bg-[#050705] flex-[1_0_0] h-full min-w-px relative rounded-[12px]" data-node-id="9:1379" data-name="Rectangle" />
          <div className="absolute left-0 size-[40px] top-0" data-node-id="9:1380" data-name="Frame">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
          </div>
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-center leading-[normal] relative shrink-0 whitespace-nowrap" data-node-id="9:1382" data-name="qr-text">
          <p className="font-['Roboto_Condensed:Bold'] font-bold relative shrink-0 text-[#f0f4a6] text-[20px] uppercase" data-node-id="9:1383">
            Scan to join the wall
          </p>
          <p className="font-['Inter:Regular'] font-normal not-italic opacity-70 relative shrink-0 text-[#f7f1c8] text-[16px]" data-node-id="9:1384">
            Take the quiz. Find your family cluster.
          </p>
        </div>
      </div>
      <div className="absolute h-[1080px] left-0 opacity-20 top-0 w-[1920px]" data-node-id="9:1385" data-name="dimmed-wall">
        <div className="absolute content-stretch flex flex-col gap-[24px] items-center left-[520px] top-[660px]" data-node-id="9:1386" data-name="cluster-The Lim Family">
          <p className="[word-break:break-word] font-['Roboto_Condensed:Bold'] font-bold leading-[normal] opacity-80 relative shrink-0 text-[#f0f4a6] text-[24px] uppercase whitespace-nowrap" data-node-id="9:1387">
            The Lim Family
          </p>
          <div className="relative shrink-0 size-[100px]" data-node-id="9:1388" data-name="members-row" />
        </div>
        <div className="absolute content-stretch flex flex-col gap-[24px] items-center left-[1200px] top-[400px]" data-node-id="9:1389" data-name="cluster-The Tan Family">
          <p className="[word-break:break-word] font-['Roboto_Condensed:Bold'] font-bold leading-[normal] opacity-80 relative shrink-0 text-[#f0f4a6] text-[24px] uppercase whitespace-nowrap" data-node-id="9:1390">
            The Tan Family
          </p>
          <div className="relative shrink-0 size-[100px]" data-node-id="9:1391" data-name="members-row" />
        </div>
      </div>
      <div className="absolute backdrop-blur-[20px] bg-[rgba(5,7,5,0.8)] border border-[rgba(240,244,166,0.25)] border-solid content-stretch flex flex-col gap-[40px] items-start left-[120px] p-[48px] rounded-[32px] top-[240px] w-[520px]" data-node-id="9:1392" data-name="overlay-panel">
        <p className="[word-break:break-word] font-['Cedarville_Cursive:Regular'] leading-[normal] not-italic relative shrink-0 text-[#f0f4a6] text-[64px] w-full" data-node-id="9:1393">{`Today's Love Mix`}</p>
        <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-node-id="9:1394" data-name="stats-list">
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="9:1395" data-name="stat-QUALITY TIME">
            <div className="[word-break:break-word] content-stretch flex font-['Roboto_Condensed:Bold'] font-bold items-start justify-between leading-[normal] relative shrink-0 text-[14px] w-full whitespace-nowrap" data-node-id="9:1396" data-name="Frame">
              <p className="relative shrink-0 text-[#f7f1c8]" data-node-id="9:1397">
                QUALITY TIME
              </p>
              <p className="relative shrink-0 text-[#a8ad82]" data-node-id="9:1398">
                34%
              </p>
            </div>
            <div className="bg-[#10150f] content-stretch flex h-[8px] items-start overflow-clip relative rounded-[4px] shrink-0 w-full" data-node-id="9:1399" data-name="track">
              <div className="bg-[#a8ad82] h-full relative shrink-0 w-[150px]" data-node-id="9:1400" data-name="fill" />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="9:1401" data-name="stat-ENCOURAGING WORDS">
            <div className="[word-break:break-word] content-stretch flex font-['Roboto_Condensed:Bold'] font-bold items-start justify-between leading-[normal] relative shrink-0 text-[#f7f1c8] text-[14px] w-full whitespace-nowrap" data-node-id="9:1402" data-name="Frame">
              <p className="relative shrink-0" data-node-id="9:1403">
                ENCOURAGING WORDS
              </p>
              <p className="relative shrink-0" data-node-id="9:1404">
                22%
              </p>
            </div>
            <div className="bg-[#10150f] content-stretch flex h-[8px] items-start overflow-clip relative rounded-[4px] shrink-0 w-full" data-node-id="9:1405" data-name="track">
              <div className="bg-[#f7f1c8] h-full relative shrink-0 w-[97px]" data-node-id="9:1406" data-name="fill" />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="9:1407" data-name="stat-HELPFUL ACTIONS">
            <div className="[word-break:break-word] content-stretch flex font-['Roboto_Condensed:Bold'] font-bold items-start justify-between leading-[normal] relative shrink-0 text-[14px] w-full whitespace-nowrap" data-node-id="9:1408" data-name="Frame">
              <p className="relative shrink-0 text-[#f7f1c8]" data-node-id="9:1409">
                HELPFUL ACTIONS
              </p>
              <p className="relative shrink-0 text-[#68734c]" data-node-id="9:1410">
                19%
              </p>
            </div>
            <div className="bg-[#10150f] content-stretch flex h-[8px] items-start overflow-clip relative rounded-[4px] shrink-0 w-full" data-node-id="9:1411" data-name="track">
              <div className="bg-[#68734c] h-full relative shrink-0 w-[84px]" data-node-id="9:1412" data-name="fill" />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="9:1413" data-name="stat-WARM AFFECTION">
            <div className="[word-break:break-word] content-stretch flex font-['Roboto_Condensed:Bold'] font-bold items-start justify-between leading-[normal] relative shrink-0 text-[14px] w-full whitespace-nowrap" data-node-id="9:1414" data-name="Frame">
              <p className="relative shrink-0 text-[#f7f1c8]" data-node-id="9:1415">
                WARM AFFECTION
              </p>
              <p className="relative shrink-0 text-[#ffdab9]" data-node-id="9:1416">
                15%
              </p>
            </div>
            <div className="bg-[#10150f] content-stretch flex h-[8px] items-start overflow-clip relative rounded-[4px] shrink-0 w-full" data-node-id="9:1417" data-name="track">
              <div className="bg-[#ffdab9] h-full relative shrink-0 w-[66px]" data-node-id="9:1418" data-name="fill" />
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="9:1419" data-name="stat-THOUGHTFUL GIFTS">
            <div className="[word-break:break-word] content-stretch flex font-['Roboto_Condensed:Bold'] font-bold items-start justify-between leading-[normal] relative shrink-0 text-[14px] w-full whitespace-nowrap" data-node-id="9:1420" data-name="Frame">
              <p className="relative shrink-0 text-[#f7f1c8]" data-node-id="9:1421">
                THOUGHTFUL GIFTS
              </p>
              <p className="relative shrink-0 text-[#d2b48c]" data-node-id="9:1422">
                10%
              </p>
            </div>
            <div className="bg-[#10150f] content-stretch flex h-[8px] items-start overflow-clip relative rounded-[4px] shrink-0 w-full" data-node-id="9:1423" data-name="track">
              <div className="bg-[#d2b48c] h-full relative shrink-0 w-[44px]" data-node-id="9:1424" data-name="fill" />
            </div>
          </div>
        </div>
        <div className="[word-break:break-word] border-[rgba(240,244,166,0.25)] border-solid border-t content-stretch flex flex-col gap-[12px] items-start leading-[normal] pt-[16px] relative shrink-0 w-full whitespace-nowrap" data-node-id="9:1425" data-name="summary-stats">
          <p className="font-['Roboto_Condensed:Bold'] font-bold relative shrink-0 text-[#f0f4a6] text-[32px]" data-node-id="9:1426">
            124 PEOPLE JOINED
          </p>
          <p className="font-['Roboto_Condensed:Medium'] font-medium relative shrink-0 text-[#a8ad82] text-[18px]" data-node-id="9:1427">
            38 FAMILIES CONNECTED
          </p>
        </div>
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
