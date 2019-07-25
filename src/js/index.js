import Search from './models/Search';
import Recipe from './models/recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import {elements,renderLoader,clearLoader} from './views/base';

// Global State of the app
// - Search Object
// - Current recipe object
// - Shopping list object
// - Liked recipes
const state = {};

/** SEARCH CONTROLLER */
const controlSearch = async () => {
    // 1. get query from view
    const query = searchView.getInput();

    if (query){
        // 2. New Search object and add to state
        state.search = new Search(query);

        // 3. Prepare UI for results (Clearing Previous Search Results)
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        // 4. Search for recipe
        await state.search.getResults();

        try{
        // 5. render results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        }catch(err){
            alert('ERROR WITH THE SEARCH');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit',e => {
    e.preventDefault();
    controlSearch();
});

elements.searhResPages.addEventListener('click',e=>{
    const btn = e.target.closest('.btn-inline');
    if(btn){
       const goToPage = parseInt(btn.dataset.goto,10);
       searchView.clearResults();
       searchView.renderResults(state.search.result,goToPage);
    }
});

/** RECIPE CONTROLLLER */
const controlRecipe = async() => {
    // get ID from URL
    const id = window.location.hash.replace('#','');
    if(id){

        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight Selected Recipe
        if(state.search) searchView.highlightSelected(id);
        
        // Create new recipe object
        state.recipe = new Recipe(id);

        // Get Recipe Data
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();
        
        try{
        // Calculate servings and time
        state.recipe.calcTime();
        state.recipe.calcServings();

        // Render the recipe page
        clearLoader();
        recipeView.renderRecipe(state.recipe,state.likes.isLiked(id));

        }catch(err){
            alert('ERROR PROCESSING RECIPE');
        }

    }
}

['hashchange','load'].forEach(el=>window.addEventListener(el,controlRecipe));

/** LIST CONTROLLER */

const controlList = () => {
    // Create a new list if there is none yet
    if(!state.list){
        state.list = new List();
    }

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el=>{
        const item = state.list.addItem(el.count,el.unit,el.ingredient);
        listView.renderItem(item);
    });
};

// Handle delete and update list item events
elements.shopping.addEventListener('click',e=>{
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle Delete Event
    if(e.target.matches('.shopping__delete,.shopping__delete *')){
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.delItem(id);
    }
    // Handle Ingredients Count add / minus
    else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value);
        if(val >= 0){
            state.list.updateCount(id,val);
        }else{

        }
    }
});

/** LIKE CONTROLLER */
const controlLike = () => {
    if(!state.likes){
        state.likes = new Likes();
    }
    const currentID = state.recipe.id;
    if(!state.likes.isLiked(currentID)){
    // User has not liked current recipe
        // Add like to the state
        const newLike = state.likes.addLike(currentID,state.recipe.title,state.recipe.author,state.recipe.img);

        // Toggle the like button 
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);

    }else{
    // User has liked current recipe    
        // Remove like to the state
        state.likes.deleteLike(currentID);

        // Toggle the like button 
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load',()=>{
    state.likes = new Likes();

    // Restore Likes
    state.likes.readStorage();

    // Toggle Like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(el => likesView.renderLike(el));
});

// Servings Controlling from Recipe Page
elements.recipe.addEventListener('click',e=>{
    if (e.target.matches('.btn-decrease, .btn-decrease *')){
        // Decrease button is clicked
        if(state.recipe.servings > 1){
        state.recipe.updateServings('dec');
        recipeView.updateServingsIngredients(state.recipe);
        }
    }else if (e.target.matches('.btn-increase, .btn-increase *')){
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.recipe__btn--add,.recipe__btn--add *')){
        // Add to shopping cart button is clicked
        controlList();
    }else if (e.target.matches('.recipe__love,.recipe__love *')){
        // like controller
        controlLike();
    }
});