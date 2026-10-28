/** Preserve assertion failures while bounding an occasional Chromium transport shutdown hang. */
export async function closeBrowser(browser,checksPassed){
 const watchdog=setTimeout(()=>{
  console.warn(`Chromium shutdown timed out after checks ${checksPassed?'passed':'failed'}; ending this test process.`);
  // This flag is set only after every assertion and report write completed successfully.
  process.exit(checksPassed?0:1);
 },8000);
 try{await browser.close();}finally{clearTimeout(watchdog);}
}
