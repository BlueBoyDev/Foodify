package com.codex.foodify.ui.chef

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.bumptech.glide.Glide
import com.codex.foodify.R
import com.codex.foodify.data.model.RecipeDto
import com.codex.foodify.databinding.BottomSheetRecipeDetailBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class RecipeDetailBottomSheet : BottomSheetDialogFragment() {
 
    private var _binding: BottomSheetRecipeDetailBinding? = null
    private val binding get() = _binding!!
 
    private var dishName: String? = null
    private var dishIcon: List<String>? = null
    private var recipe: RecipeDto? = null
 
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            dishName = it.getString(ARG_DISH_NAME)
            dishIcon = it.getStringArrayList(ARG_DISH_ICON)
            recipe   = it.getParcelable(ARG_RECIPE)
        }
    }
 
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        _binding = BottomSheetRecipeDetailBinding.inflate(inflater, container, false)
        return binding.root
    }
 
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
    }
 
    private fun setupUI() {
        val r = recipe ?: return
        binding.tvRecipeTitle.text = dishName ?: "Receta"
        binding.tvPrepTime.text = "Prep: ${r.prepTimeMin} min"
        binding.tvServings.text = "Para: ${r.servings} pers."
 
        val imageUrl = dishIcon?.firstOrNull()
        if (imageUrl.isNullOrBlank()) {
            binding.ivRecipeDish.visibility = View.GONE
        } else {
            binding.ivRecipeDish.visibility = View.VISIBLE
            Glide.with(this)
                .load(imageUrl)
                .placeholder(R.drawable.ic_foodify_logo)
                .error(R.drawable.ic_foodify_logo) // Fallback
                .listener(object : com.bumptech.glide.request.RequestListener<android.graphics.drawable.Drawable> {
                    override fun onLoadFailed(
                        e: com.bumptech.glide.load.engine.GlideException?,
                        model: Any?,
                        target: com.bumptech.glide.request.target.Target<android.graphics.drawable.Drawable>,
                        isFirstResource: Boolean
                    ): Boolean {
                        binding.ivRecipeDish.visibility = View.GONE
                        return false
                    }

                    override fun onResourceReady(
                        resource: android.graphics.drawable.Drawable,
                        model: Any,
                        target: com.bumptech.glide.request.target.Target<android.graphics.drawable.Drawable>,
                        dataSource: com.bumptech.glide.load.DataSource,
                        isFirstResource: Boolean
                    ): Boolean {
                        return false
                    }
                })
                .centerCrop()
                .into(binding.ivRecipeDish)
        }
 
        // Ingredientes
        val ingredientsText = if (r.ingredients.isNotEmpty()) {
            r.ingredients.joinToString("\n") { 
                "• ${it.quantity} ${it.unit} de ${it.name}${if (it.isOptional) " (Opcional)" else ""}"
            }
        } else {
            "No se especificaron ingredientes."
        }
        binding.tvIngredientsList.text = ingredientsText
 
        // Pasos
        val stepsText = r.steps?.sortedBy { it.order }?.joinToString("\n\n") { 
            "${it.order}. ${it.description}"
        } ?: "No hay pasos detallados disponibles."
        binding.tvStepsList.text = stepsText
 
        binding.btnClose.setOnClickListener { dismiss() }
    }
 
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
 
    companion object {
        private const val ARG_DISH_NAME = "dish_name"
        private const val ARG_DISH_ICON = "dish_icon"
        private const val ARG_RECIPE    = "recipe"
 
        fun newInstance(dishName: String, dishImages: List<String>?, recipe: RecipeDto) = 
            RecipeDetailBottomSheet().apply {
                arguments = Bundle().apply {
                    putString(ARG_DISH_NAME, dishName)
                    putStringArrayList(ARG_DISH_ICON, ArrayList(dishImages ?: emptyList()))
                    putParcelable(ARG_RECIPE, recipe)
                }
            }
    }
}
