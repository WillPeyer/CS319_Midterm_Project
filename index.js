//global arrays to store recipes
let allRecipes = [];
let myRecipes = [];

/**
 * Fetches all recipes from the JSON file
 */
async function fetchAllRecipes() {
    try {
        const response = await fetch('data.json');
        allRecipes = await response.json();
        displayRecipes(allRecipes, 'all-recipes-grid');
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
}

/**
 * Fetches user's recipes from local storage
 */
function fetchMyRecipes() {
    const storedRecipes = localStorage.getItem('myRecipes');
    if (storedRecipes) {
        myRecipes = JSON.parse(storedRecipes);
    }
    displayRecipes(myRecipes, 'my-recipes-grid');
}

/**
 * Displays recipes in a grid layout
 * @param {Array} recipesToDisplay - Array of recipes to display
 * @param {string} gridId - ID of the grid element to populate
 */
function displayRecipes(recipesToDisplay, gridId) {
    const recipeGrid = document.getElementById(gridId);
    if (recipeGrid) {
        recipeGrid.innerHTML = ''; //clear existing content

        recipesToDisplay.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'col-md-4 mb-4';
            recipeCard.innerHTML = `
                <div class="card h-100">
                    <img src="${recipe.image || '/api/placeholder/250/200'}" class="card-img-top" alt="${recipe.name}">
                    <div class="card-body">
                        <h5 class="card-title">${recipe.name}</h5>
                        <p class="card-text">${recipe.ingredients.slice(0, 3).join(', ')}${recipe.ingredients.length > 3 ? '...' : ''}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary view-recipe" data-id="${recipe.id}">View Recipe</button>
                        ${gridId === 'my-recipes-grid' ?
                    `<button class="btn btn-danger delete-recipe" data-id="${recipe.id}">Delete</button>` :
                    `<button class="btn btn-success save-recipe" data-id="${recipe.id}">Save to My Recipes</button>`
                }
                    </div>
                </div>
            `;
            recipeGrid.appendChild(recipeCard);
        });

        //add event listeners
        recipeGrid.querySelectorAll('.view-recipe').forEach(button => {
            button.addEventListener('click', () => showRecipeDetails(button.getAttribute('data-id')));
        });

        if (gridId === 'my-recipes-grid') {
            recipeGrid.querySelectorAll('.delete-recipe').forEach(button => {
                button.addEventListener('click', () => deleteRecipe(button.getAttribute('data-id')));
            });
        } else {
            recipeGrid.querySelectorAll('.save-recipe').forEach(button => {
                button.addEventListener('click', () => saveRecipeToMyRecipes(button.getAttribute('data-id')));
            });
        }
    }
}

/**
 * Saves a recipe to My Recipes
 * @param {string} recipeId - ID of the recipe to save
 */
function saveRecipeToMyRecipes(recipeId) {
    const recipe = allRecipes.find(r => r.id === parseInt(recipeId));
    if (recipe && !myRecipes.some(r => r.id === recipe.id)) {
        myRecipes.push(recipe);
        localStorage.setItem('myRecipes', JSON.stringify(myRecipes));
        alert('Recipe saved to My Recipes!');
    }
}

/**
 * Deletes a recipe from My Recipes
 * @param {string} recipeId - ID of the recipe to delete
 */
function deleteRecipe(recipeId) {
    myRecipes = myRecipes.filter(r => r.id !== parseInt(recipeId));
    localStorage.setItem('myRecipes', JSON.stringify(myRecipes));
    fetchMyRecipes(); // Refresh the display
}

/**
 * Navigates to the recipe detail page for a specific recipe
 * @param {string} recipeId - ID of the recipe to display details for
 */
function showRecipeDetails(recipeId) {
    window.location.href = `recipe-detail.html?id=${recipeId}`;
}

/**
 * Loads and displays details for a specific recipe on the recipe detail page
 */
async function loadRecipeDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    console.log('Recipe ID:', recipeId);

    // Ensure allRecipes is populated
    if (allRecipes.length === 0) {
        await fetchAllRecipes();
    }

    // Ensure myRecipes is populated
    if (myRecipes.length === 0) {
        fetchMyRecipes();
    }

    console.log('All Recipes:', allRecipes);
    console.log('My Recipes:', myRecipes);

    const recipe = [...allRecipes, ...myRecipes].find(r => r.id === parseInt(recipeId));
    console.log('Found Recipe:', recipe);

    const recipeDetailElement = document.getElementById('recipe-detail');
    if (recipeDetailElement) {
        if (recipe) {
            const detailHtml = `
                <div class="card">
                    <img src="${recipe.image || '/api/placeholder/400/300'}" class="card-img-top" alt="${recipe.name}">
                    <div class="card-body">
                        <h1 class="card-title">${recipe.name}</h1>
                        <h2>Ingredients:</h2>
                        <ul class="list-group list-group-flush mb-3">
                            ${recipe.ingredients.map(ing => `<li class="list-group-item">${ing}</li>`).join('')}
                        </ul>
                        <h2>Instructions:</h2>
                        <ol class="list-group list-group-numbered">
                            ${recipe.instructions.map(inst => `<li class="list-group-item">${inst}</li>`).join('')}
                        </ol>
                    </div>
                </div>
            `;
            recipeDetailElement.innerHTML = detailHtml;
        } else {
            recipeDetailElement.innerHTML = '<div class="alert alert-danger" role="alert">Recipe not found</div>';
        }
    }
}

/**
 * Searches recipes based on user input
 * Filters recipes by name or ingredients
 */
function searchRecipes() {
    const searchTerm = document.getElementById('recipe-search').value.toLowerCase();
    const recipesToSearch = window.location.pathname.includes('my-recipes.html') ? myRecipes : allRecipes;
    const filteredRecipes = recipesToSearch.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm))
    );
    displayRecipes(filteredRecipes, window.location.pathname.includes('my-recipes.html') ? 'my-recipes-grid' : 'all-recipes-grid');
}

/**
 * Adds a new recipe to the collection
 * @param {Event} event - The form submission event
 */
function addRecipe(event) {
    event.preventDefault();
    const form = event.target;
    const newRecipe = {
        id: Date.now(), // Use timestamp as a unique ID
        name: form['recipe-name'].value,
        ingredients: form.ingredients.value.split('\n'),
        instructions: form.instructions.value.split('\n'),
        image: form['recipe-image'].value || "/api/placeholder/250/200"
    };
    myRecipes.push(newRecipe);
    localStorage.setItem('myRecipes', JSON.stringify(myRecipes));

    const alertPlaceholder = document.getElementById('alert-placeholder');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            Recipe added successfully!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    alertPlaceholder.append(wrapper);
    form.reset();
}

// Event listeners for when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        fetchAllRecipes();
    } else if (window.location.pathname.includes('my-recipes.html')) {
        fetchMyRecipes();
    } else if (window.location.pathname.includes('recipe-detail.html')) {
        loadRecipeDetail();
    }

    const searchInput = document.getElementById('recipe-search');
    if (searchInput) {
        searchInput.addEventListener('input', searchRecipes);
    }

    const createForm = document.getElementById('create-recipe-form');
    if (createForm) {
        createForm.addEventListener('submit', addRecipe);
    }
});