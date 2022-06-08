<script>
    export let isRegEx = false;
    export let inputTextArea = '';
</script>

<div class="flex ">
    <div class="mb-3 xl:w-96">
        <label for="textarea" class="inline-block mb-2 text-gray-700 dark:text-white">Example textarea</label>
        <input
                class="resize-none block w-full px-3 py-1.5 text-base font-normal text-gray-700  bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                id="textarea"
                bind:value={inputTextArea}
                placeholder="Insert {isRegEx ? 'regex' : 'word'}"
        />
    </div>
</div>