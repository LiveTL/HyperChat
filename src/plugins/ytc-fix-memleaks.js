// ==UserScript==
// @name         Workaround For Youtube Chat Memory Leaks
// @namespace    https://twitter.com/laversheet
// @version      0.1
// @description  Fix Youtube Live Chat Memory Leaks
// @author       laversheet
// @match        https://www.youtube.com/live_chat*
// @match        https://www.youtube.com/live_chat_replay*
// @run-at       document-end
// @grant        none
// @license      BSD-3-Clause https://opensource.org/licenses/BSD-3-Clause
// ==/UserScript==
 
export function fixLeaks() {
    'use strict';
    /*
     * Currently (2021-02-23), youtube live chat has a bug that never execute some scheduled tasks.
     * Those tasks are scheduled for each time a new message is added to the chat and hold the memory until being executed.
     * This script will let the scheduler to execute those tasks so the memory held by those tasks could be freed.
     */
    function fixSchedulerLeak() {
        if (!window.requestAnimationFrame) {
            console.warn("fixSchedulerLeak: window.requestAnimationFrame() is required, but missing");
            return;
        }
        const scheduler = window.ytglobal && window.ytglobal.schedulerInstanceInstance_;
        if (!scheduler) {
            console.warn("fixSchedulerLeak: schedulerInstanceInstance_ is missing");
            return;
        }
        const code = "" + scheduler.constructor;
        const p1 = code.match(/this\.(\w+)\s*=\s*!!\w+\.useRaf/);
        const p2 = code.match(/\(\"visibilitychange\",\s*this\.(\w+)\)/);
        if (!p1 || !p2) {
            console.warn("fixSchedulerLeak: unknown code");
            return;
        }
        const useRafProp = p1[1];
        const visChgProp = p2[1];
        if (scheduler[useRafProp]) {
            console.info("fixSchedulerLeak: no work needed");
            return;
        }
        scheduler[useRafProp] = true;
        document.addEventListener("visibilitychange", scheduler[visChgProp]);
        console.info("fixSchedulerLeak: leak fixed");
        return true;
    }
 
    /* Enable the element pool to save memory consumption. */
    function enableElementPool() {
        const ytcfg = window.ytcfg;
        if (!ytcfg) {
            console.warn("enableElementPool: ytcfg is missing");
            return;
        }
        if (ytcfg.get("ELEMENT_POOL_DEFAULT_CAP")) {
            console.info("enableElementPool: no work needed");
            return;
        }
        ytcfg.set("ELEMENT_POOL_DEFAULT_CAP", 75);
        console.info("enableElementPool: element pool enabled");
        return true;
    }
 
    const fixedScheduler = fixSchedulerLeak();
    const enabledPool = enableElementPool();
    return fixedScheduler && enabledPool;
}
