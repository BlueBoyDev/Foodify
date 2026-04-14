// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/categories/DeleteCategoryBottomSheet.kt
package com.codex.foodify.ui.admin.menu.categories

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.databinding.BottomSheetDeleteCategoryBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class DeleteCategoryBottomSheet : BottomSheetDialogFragment() {

    private var _binding: BottomSheetDeleteCategoryBinding? = null
    private val binding get() = _binding!!

    var onDeleteConfirmed: (() -> Unit)? = null

    private var categoryName: String = ""
    private var affectedDishes: ArrayList<String>? = null

    companion object {
        private const val ARG_CATEGORY_NAME = "category_name"
        private const val ARG_DISHES = "affected_dishes"

        fun newInstance(categoryName: String, dishes: List<String>): DeleteCategoryBottomSheet {
            return DeleteCategoryBottomSheet().apply {
                arguments = Bundle().apply {
                    putString(ARG_CATEGORY_NAME, categoryName)
                    putStringArrayList(ARG_DISHES, ArrayList(dishes))
                }
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetDeleteCategoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        categoryName = arguments?.getString(ARG_CATEGORY_NAME) ?: ""
        affectedDishes = arguments?.getStringArrayList(ARG_DISHES)

        binding.textViewMessage.text =
            "Esta acción eliminará la categoría \"$categoryName\". " +
            "Los platillos asignados a esta categoría quedarán sin categoría vinculada."

        if (!affectedDishes.isNullOrEmpty()) {
            binding.textViewDishesHeader.visibility = View.VISIBLE
            binding.recyclerViewDishes.visibility = View.VISIBLE
            setupRecyclerView()
        }

        binding.buttonCancel.setOnClickListener { dismiss() }

        binding.buttonDelete.setOnClickListener {
            onDeleteConfirmed?.invoke()
            dismiss()
        }
    }

    private fun setupRecyclerView() {
        binding.recyclerViewDishes.layoutManager = LinearLayoutManager(requireContext())
        binding.recyclerViewDishes.adapter = object : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
            inner class DishViewHolder(val textView: TextView) : RecyclerView.ViewHolder(textView)

            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
                val tv = TextView(parent.context).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, 
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    )
                    setPadding(0, 8, 0, 8)
                    textSize = 14f
                    // Usamos un color que sepamos que existe o el genérico de Android
                    setTextColor(androidx.core.content.ContextCompat.getColor(context, android.R.color.black))
                }
                return DishViewHolder(tv)
            }

            override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
                if (holder is DishViewHolder) {
                    holder.textView.text = "• ${affectedDishes?.get(position) ?: ""}"
                }
            }

            override fun getItemCount(): Int = affectedDishes?.size ?: 0
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
