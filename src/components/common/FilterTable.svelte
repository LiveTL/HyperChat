<script lang="ts">
    import type { Writable } from 'svelte/store';
    import TextArea from './TextArea.svelte';
    import { isRegexFilter } from '../../ts/storage';
    export let store: Writable<{ id: number, value: string, isRegEx: boolean }[]>;
    export let inputTextArea: string;

    $: isRegEx = $isRegexFilter;
    $: value = inputTextArea;

    const updateStore = (id: number, value: string) => {
      inputTextArea = '';
      $store = [...$store, { id, value, isRegEx }];
    };

    const deleteElement = (id: number) => {
      $store = $store.filter(element => element.id !== id);
    };
</script>

<TextArea bind:isRegEx bind:inputTextArea />
<button on:click={updateStore(Date.now(), value)} class="text-white bg-primary-500 rounded h-8" style="width: 5rem">Add</button>
<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
            <th scope="col" class="px-6 py-3">
                Filter Type
            </th>
            <th scope="col" class="px-6 py-3">
                Filter Query
            </th>
            <th scope="col" class="px-6 py-3">
                <span class="sr-only">Edit/Delete</span>
            </th>
        </tr>
        </thead>
        <tbody>
            {#each $store as element}
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th scope="row" class="px-6 py-4 font-medium text-gray-700 dark:text-white whitespace-nowrap">
                    {element.isRegEx ? 'Regular expression' : 'Filtering by contents'}
                </th>
                <td class="px-6 py-4 font-medium text-gray-700 dark:text-white whitespace-nowrap">
                    {element.value}
                </td>
                <td class="px-6 py-4 text-center">
                    <button on:click={deleteElement(element.id)} class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Delete</button>
                </td>
            </tr>
            {/each}
        </tbody>
    </table>
</div>