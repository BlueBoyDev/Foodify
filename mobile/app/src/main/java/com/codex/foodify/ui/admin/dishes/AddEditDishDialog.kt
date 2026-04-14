// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dishes/AddEditDishDialog.kt
package com.codex.foodify.ui.admin.dishes

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import com.codex.foodify.data.model.*
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.DialogAddEditDishBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.gson.Gson

class AddEditDishDialog : BottomSheetDialogFragment() {

    private var _binding: DialogAddEditDishBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DishesViewModel by activityViewModels()
    private var isEditMode = false
    private var editDishId: Int? = null
    private var selectedCategoryId: Int? = null

    private val selectedImages = mutableListOf<String>()
    private lateinit var imagesAdapter: SelectedImagesAdapter
    private lateinit var ingredientsAdapter: IngredientsFormAdapter
    private var lastLocalPath: String? = null
    private var imagesUploadingCount = 0


    private val pickImageLauncher = registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let { addImage(it) }
    }

    companion object {
        private const val ARG_DISH_ID = "dish_id"
        fun newInstance(dishId: Int? = null) = AddEditDishDialog().apply {
            arguments = Bundle().apply {
                if (dishId != null) putInt(ARG_DISH_ID, dishId)
            }
        }
    }

    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        editDishId = arguments?.getInt(ARG_DISH_ID)?.takeIf { it != 0 }
        isEditMode = editDishId != null
        
        // Resetear el estado de acción al abrir para evitar bloqueos por errores previos
        viewModel.clearActionState()
    }

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = DialogAddEditDishBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onStart() {
        super.onStart()
        (dialog as? com.google.android.material.bottomsheet.BottomSheetDialog)?.behavior?.state = 
            com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_EXPANDED
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupImagesRecyclerView()
        setupCategoryDropdown()
        setupIngredientsRecyclerView()
        
        binding.tvTitle.text = if (isEditMode) "Editar Platillo" else "Nuevo Platillo"
        binding.btnSave.text = if (isEditMode) "GUARDAR CAMBIOS" else "CREAR PLATILLO"

        observeViewModel()

        if (isEditMode) {
            viewModel.loadDishForEditing(editDishId!!)
        } else {
            viewModel.clearEditingData()
        }

        binding.btnAddIngredient.setOnClickListener {
            showIngredientDialog(null) { newIng -> viewModel.addIngredient(newIng) }
        }

        binding.btnAddImage.setOnClickListener {
            if (selectedImages.size < 3) {
                pickImageLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
            } else {
                Toast.makeText(requireContext(), "Máximo 3 imágenes", Toast.LENGTH_SHORT).show()
            }
        }

        binding.btnSave.setOnClickListener { save() }
        binding.btnCancel.setOnClickListener { dismiss() }

        // Cargar datos necesarios
        viewModel.loadAllCategoriesGrouped()
        viewModel.loadInventoryItems()
    }

    private fun observeViewModel() {
        // Observamos tanto menús como categorías para el adapter seccionado
        viewModel.categories.observe(viewLifecycleOwner) { categories: List<DishCategory> ->
            val menus = viewModel.menus.value ?: emptyList()
            if (categories.isNotEmpty() && menus.isNotEmpty()) {
                val adapter = CategorySpinnerAdapter(requireContext(), menus, categories)
                binding.etCategory.setAdapter(adapter)
                
                // Intentar poblar si ya hay dish cargado
                viewModel.editingDish.value?.let { dish ->
                    populateCategory(dish.categoryId, dish.category)
                }
            }
        }

        viewModel.menus.observe(viewLifecycleOwner) { menus: List<Menu> ->
            val categories = viewModel.categories.value ?: emptyList()
            if (menus.isNotEmpty() && categories.isNotEmpty()) {
                val adapter = CategorySpinnerAdapter(requireContext(), menus, categories)
                binding.etCategory.setAdapter(adapter)
            }
        }

        viewModel.editingDish.observe(viewLifecycleOwner) { dish ->
            dish?.let { populateDishData(it) }
        }

        viewModel.editingRecipe.observe(viewLifecycleOwner) { recipe ->
            recipe?.let { populateRecipeData(it) }
        }

        viewModel.ingredientList.observe(viewLifecycleOwner) { ingredients ->
            ingredientsAdapter.submitList(ingredients.toList())
            binding.tvNoIngredients.visibility = if (ingredients.isEmpty()) View.VISIBLE else View.GONE
        }

        viewModel.actionState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is Result.Success -> {
                    Toast.makeText(requireContext(), "Operación exitosa", Toast.LENGTH_SHORT).show()
                    dismiss()
                }
                is Result.Error -> {
                    binding.btnSave.isEnabled = true
                    Toast.makeText(requireContext(), result.message, Toast.LENGTH_LONG).show()
                }
                is Result.Loading -> {
                    binding.btnSave.isEnabled = false
                }
                else -> {
                    binding.btnSave.isEnabled = true
                }
            }
        }
        
        // Listener para habilitar/deshabilitar el botón de guardado según las subidas
        viewModel.uploadState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is Result.Loading -> {
                    imagesUploadingCount++
                    updateSaveButtonState()
                }
                is Result.Success, is Result.Error -> {
                    if (imagesUploadingCount > 0) imagesUploadingCount--
                    updateSaveButtonState()
                }
                else -> {}
            }
        }

        viewModel.uploadState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is Result.Loading -> {
                    binding.progressBarImages.visibility = View.VISIBLE
                    binding.ivAddIcon.visibility = View.INVISIBLE
                    binding.btnAddImage.isEnabled = false
                }
                is Result.Success -> {
                    binding.progressBarImages.visibility = View.GONE
                    binding.ivAddIcon.visibility = View.VISIBLE
                    binding.btnAddImage.isEnabled = true
                    
                    // Reemplazar la ruta local temporal por la URL definitiva de S3
                    lastLocalPath?.let { local ->
                        val index = selectedImages.indexOf(local)
                        if (index != -1) {
                            selectedImages[index] = result.data
                            imagesAdapter.submitList(selectedImages.toList())
                        }
                    }
                    
                    lastLocalPath = null
                    // NO limpiar el estado aquí si impacta el contador global, 
                    // lo limpiamos solo si es necesario para el UI individual
                }
                is Result.Error -> {
                    binding.progressBarImages.visibility = View.GONE
                    binding.ivAddIcon.visibility = View.VISIBLE
                    binding.btnAddImage.isEnabled = true
                    
                    // Si falló, remover la imagen local para no intentar guardarla como path local
                    lastLocalPath?.let { local ->
                        selectedImages.remove(local)
                        imagesAdapter.submitList(selectedImages.toList())
                    }
                    
                    lastLocalPath = null
                    Toast.makeText(requireContext(), "Error al subir imagen: ${result.message}", Toast.LENGTH_SHORT).show()
                }
                else -> {
                    binding.progressBarImages.visibility = View.GONE
                    binding.ivAddIcon.visibility = View.VISIBLE
                    binding.btnAddImage.isEnabled = true
                }
            }
        }
    }

    private fun updateSaveButtonState() {
        binding.btnSave.isEnabled = imagesUploadingCount == 0 && viewModel.actionState.value !is Result.Loading
        binding.btnSave.alpha = if (binding.btnSave.isEnabled) 1.0f else 0.5f
    }

    private fun populateDishData(dish: Dish) {
        binding.etName.setText(dish.displayName)
        binding.etPrice.setText(dish.displayPrice.toString())
        binding.etTime.setText(dish.displayTime.toString())
        binding.etDescription.setText(dish.description ?: "")
        binding.switchAvailable.isChecked = dish.displayAvailable

        // Poblar categoría (depende de que la lista de categorías esté cargada)
        populateCategory(dish.categoryId, dish.category)

        // Imágenes - Solo cargar si la lista local está vacía para no sobrescribir selecciones actuales
        if (selectedImages.isEmpty()) {
            dish.images?.let { 
                selectedImages.addAll(it)
                imagesAdapter.submitList(selectedImages.toList())
            }
        }
    }

    private fun populateCategory(catId: Int?, dishCategory: com.codex.foodify.data.model.DishCategory?) {
        val categories = viewModel.categories.value ?: emptyList()
        
        // Priorizar ID si está disponible
        val targetId = catId ?: dishCategory?.id
        selectedCategoryId = targetId

        // Buscar el nombre para mostrarlo en el dropdown/autocomplete
        val catName = categories.find { it.id == targetId }?.name ?: dishCategory?.name
        
        if (catName != null) {
            // setText con filter=false para evitar que se abra el desplegable al poblar
            binding.etCategory.setText(catName, false)
        }
    }

    private fun populateRecipeData(recipe: RecipeDto) {
        val stepsText = recipe.steps?.sortedBy { it.order }?.joinToString("\n") { it.description } ?: ""
        binding.etRecipeSteps.setText(stepsText)
    }

    private fun setupCategoryDropdown() {
        binding.etCategory.setOnClickListener {
            binding.etCategory.showDropDown()
        }
        binding.etCategory.setOnItemClickListener { parent, _, position, _ ->
            val item = parent.getItemAtPosition(position)
            if (item is CategorySpinnerAdapter.Item.Category) {
                selectedCategoryId = item.category.id
            }
        }
    }

    private fun setupImagesRecyclerView() {
        imagesAdapter = SelectedImagesAdapter { position ->
            selectedImages.removeAt(position)
            imagesAdapter.submitList(selectedImages.toList())
        }
        binding.rvSelectedImages.apply {
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
            adapter = imagesAdapter
        }
    }

    private fun setupIngredientsRecyclerView() {
        ingredientsAdapter = IngredientsFormAdapter(
            onEdit = { index, ingredient ->
                showIngredientDialog(ingredient) { updated ->
                    viewModel.updateIngredient(index, updated)
                }
            },
            onDelete = { ingredient ->
                viewModel.removeIngredient(ingredient)
            }
        )
        binding.rvIngredients.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = ingredientsAdapter
        }
    }

    private fun showIngredientDialog(existing: RecipeIngredientDto?, onSave: (RecipeIngredientDto) -> Unit) {
        val dialogBinding = com.codex.foodify.databinding.DialogIngredientBinding.inflate(layoutInflater)
        
        // Setup Unidades
        val units = listOf("kg", "g", "lt", "ml", "pza", "taza", "cdta", "cda")
        dialogBinding.actvUnit.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, units))

        // Setup AutoComplete de nombres de insumos (Solo con stock > 0)
        val availableInsumos = viewModel.inventoryItems.value?.filter { it.currentStock > 0 } ?: emptyList()
        val inventoryNames = availableInsumos.map { it.name }
        dialogBinding.etIngName.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, inventoryNames))

        // Auto-llenado de unidad al seleccionar
        dialogBinding.etIngName.setOnItemClickListener { parent, _, position, _ ->
            val selectedName = parent.getItemAtPosition(position) as String
            val item = availableInsumos.find { it.name == selectedName }
            item?.let {
                dialogBinding.actvUnit.setText(it.unit, false)
                // Mostrar stock disponible como pista (opcional)
                val textLayout = dialogBinding.etIngName.parent.parent as? com.google.android.material.textfield.TextInputLayout
                textLayout?.helperText = "Disponible: ${it.currentStock} ${it.unit}"
            }
        }

        existing?.let { ing ->
            dialogBinding.etIngName.setText(ing.name)
            dialogBinding.etIngQuantity.setText(ing.quantity.toString())
            dialogBinding.actvUnit.setText(ing.unit, false)
            dialogBinding.cbOptional.isChecked = ing.isOptional
            
            // Si es edición, buscar el item para mostrar el stock
            val item = viewModel.inventoryItems.value?.find { it.name == ing.name }
            item?.let {
                val textLayout = dialogBinding.etIngName.parent.parent as? com.google.android.material.textfield.TextInputLayout
                textLayout?.helperText = "Disponible: ${it.currentStock} ${it.unit}"
            }
        }

        com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
            .setTitle(if (existing == null) "Agregar ingrediente" else "Editar ingrediente")
            .setView(dialogBinding.root)
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Guardar") { _, _ ->
                val name = dialogBinding.etIngName.text.toString().trim()
                val qty = dialogBinding.etIngQuantity.text.toString().toDoubleOrNull() ?: 0.0
                val unit = dialogBinding.actvUnit.text.toString()
                
                if (name.isNotEmpty() && qty > 0) {
                    val itemId = viewModel.inventoryItems.value?.find { it.name == name }?.id
                    onSave(RecipeIngredientDto(
                        id = existing?.id,
                        itemId = itemId,
                        name = name,
                        quantity = qty,
                        unit = unit,
                        isOptional = dialogBinding.cbOptional.isChecked
                    ))
                } else if (qty <= 0) {
                    Toast.makeText(requireContext(), "La cantidad debe ser mayor a 0", Toast.LENGTH_SHORT).show()
                }
            }
            .show()
    }

    private fun addImage(uri: Uri) {
        val file = uriToFile(uri)
        if (file != null) {
            // Mostrar imagen localmente de inmediato usando la ruta del archivo en cache
            val localPath = file.absolutePath
            lastLocalPath = localPath
            selectedImages.add(localPath)
            imagesAdapter.submitList(selectedImages.toList())

            // Preparar subida
            val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
            viewModel.uploadImage(body)
        } else {
            Toast.makeText(requireContext(), "Error al procesar la imagen (Permisos o almacenamiento)", Toast.LENGTH_SHORT).show()
        }
    }

    private fun uriToFile(uri: Uri): java.io.File? {
        return try {
            val contentResolver = requireContext().contentResolver
            val fileName = "temp_image_${System.currentTimeMillis()}.jpg"
            val file = java.io.File(requireContext().cacheDir, fileName)
            contentResolver.openInputStream(uri)?.use { input ->
                file.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            file
        } catch (e: Exception) {
            null
        }
    }

    private fun save() {
        val name = binding.etName.text.toString().trim()
        
        // Parsing robusto para manejar comas o puntos
        val priceStr = binding.etPrice.text.toString().replace(",", ".")
        val price = priceStr.toDoubleOrNull() ?: 0.0
        
        val categoryName = binding.etCategory.text.toString().trim()
        
        // Prioridad de ID de categoría:
        // 1. ID explícitamente seleccionado del dropdown
        // 2. Búsqueda por nombre en la lista cargada (si el usuario escribió algo que coincide)
        // 3. ID original del platillo si no se cambió nada
        var categoryId = selectedCategoryId ?: viewModel.categories.value?.find { 
            it.name.equals(categoryName, ignoreCase = true) 
        }?.id
        
        if (categoryId == null && isEditMode) {
            categoryId = viewModel.editingDish.value?.categoryId ?: viewModel.editingDish.value?.category?.id
        }

        if (name.isEmpty() || price <= 0 || categoryId == null) {
            val msg = when {
                name.isEmpty() -> "El nombre es requerido"
                price <= 0 -> "El precio debe ser mayor a 0 (ingresado: $priceStr)"
                categoryId == null -> "Debes seleccionar una categoría (actualmente vacía)"
                else -> "Por favor completa los campos requeridos"
            }
            Toast.makeText(requireContext(), msg, Toast.LENGTH_LONG).show()
            return
        }

        // LIMPIEZA CRÍTICA: Filtrar cualquier ruta que no sea una URL válida de internet
        // Esto evita que rutas como "/cache/..." o "content://..." lleguen a la BD
        val validImages = selectedImages.filter { 
            it.startsWith("http") || it.startsWith("https") || it.contains("amazonaws.com")
        }

        android.util.Log.d("AddEditDishDialog", "Guardando platillo: $name")
        android.util.Log.d("AddEditDishDialog", "Imágenes enviadas al servidor: $validImages")

        val req = CreateDishRequest(
            name = name,
            price = price,
            prepTimeMin = binding.etTime.text.toString().toIntOrNull() ?: 15,
            description = binding.etDescription.text.toString().ifEmpty { null },
            categoryId = categoryId,
            images = validImages
        )

        val stepsText = binding.etRecipeSteps.text.toString().trim()
        val steps = if (stepsText.isNotEmpty()) {
            stepsText.split("\n").mapIndexed { i, s -> com.codex.foodify.data.model.RecipeStepDto(i + 1, s) }
        } else null

        viewModel.saveDish(editDishId, req, steps)
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
