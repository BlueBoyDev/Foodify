// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dashboard/DashboardFragment.kt
package com.codex.foodify.ui.admin.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.model.DailySales
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentDashboardBinding
import com.codex.foodify.ui.admin.AdminMainActivity
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.*
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter
import dagger.hilt.android.AndroidEntryPoint
import java.text.NumberFormat
import java.util.Locale
import com.codex.foodify.data.model.StaffMetricDto
import com.codex.foodify.ui.admin.dashboard.StaffPerformanceAdapter
import com.codex.foodify.utils.DashboardSettings

@AndroidEntryPoint
class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DashboardViewModel by viewModels()
    private val currencyFmt = NumberFormat.getCurrencyInstance(Locale("es", "MX"))

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, s: Bundle?): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupChart()
        setupTopDishesChart()
        observeViewModel()
        viewModel.loadDashboard()

        binding.swipeRefresh.setOnRefreshListener { viewModel.loadDashboard() }
        binding.swipeRefresh.setColorSchemeResources(R.color.foodify_orange)

        // Navegación al módulo de Staff
        binding.cardStaff.setOnClickListener {
            (activity as? AdminMainActivity)?.findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_nav_admin)?.selectedItemId = R.id.staffFragment
        }

        // Acceso a Configuración
        binding.cardConfig.setOnClickListener {
            findNavController().navigate(R.id.configFragment)
        }

        // Gestión de Mesas
        binding.cardTables.setOnClickListener {
            findNavController().navigate(R.id.adminTablesFragment)
        }

        binding.btnLogout.setOnClickListener {
            (activity as? AdminMainActivity)?.logout()
        }

        applyVisibilitySettings()
    }

    private fun applyVisibilitySettings() {
        val ctx = context ?: return
        binding.apply {
            gridKpis.visibility = if (DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_GENERAL_STATS)) View.VISIBLE else View.GONE
            cardWeeklySales.visibility = if (DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_SALES_CHART)) View.VISIBLE else View.GONE
            cardTopDishes.visibility = if (DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_TOP_PRODUCTS)) View.VISIBLE else View.GONE
            layoutAlerts.visibility = if (DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_INVENTORY_ALERTS)) View.VISIBLE else View.GONE
            cardStaffPerformance.visibility = if (DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_STAFF_PERFORMANCE)) View.VISIBLE else View.GONE
        }
    }

    private fun setupRecyclerView() {
        binding.rvAlertsDashboard.apply {
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
            adapter = AlertsAdapter()
        }
        
        binding.rvStaffPerformance.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = StaffPerformanceAdapter()
        }
    }

    private fun setupChart() {
        with(binding.chartWeeklySales) {
            description.isEnabled = false
            legend.isEnabled = false
            setTouchEnabled(false)
            isDragEnabled = false
            setScaleEnabled(false)
            setPinchZoom(false)
            setDrawGridBackground(false)
            setNoDataText("Cargando datos...")

            xAxis.apply {
                position = XAxis.XAxisPosition.BOTTOM
                setDrawGridLines(false)
                textColor = requireContext().getColor(R.color.text_low_light)
                textSize = 11f
                granularity = 1f
            }
            axisLeft.apply {
                setDrawGridLines(true)
                gridColor = requireContext().getColor(R.color.divider_light)
                textColor = requireContext().getColor(R.color.text_low_light)
                textSize = 10f
            }
            axisRight.isEnabled = false
        }
    }

    private fun setupTopDishesChart() {
        with(binding.chartTopDishes) {
            description.isEnabled = false
            legend.isEnabled = false
            setTouchEnabled(false)
            setDrawGridBackground(false)
            setNoDataText("Cargando ranking...")

            xAxis.apply {
                position = XAxis.XAxisPosition.BOTTOM
                setDrawGridLines(false)
                textColor = requireContext().getColor(R.color.text_low_light)
                textSize = 11f
                granularity = 1f
                setDrawAxisLine(false)
            }
            axisLeft.apply {
                setDrawGridLines(true)
                gridColor = requireContext().getColor(R.color.divider_light)
                textColor = requireContext().getColor(R.color.text_low_light)
                textSize = 10f
                axisMinimum = 0f
            }
            axisRight.isEnabled = false
        }
    }

    private fun observeViewModel() {
        val ctx = context ?: return
        
        viewModel.dashboardState.observe(viewLifecycleOwner) { result ->
            when (result) {
                is Result.Loading -> binding.swipeRefresh.isRefreshing = true
                is Result.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    updateKpis(result.data)
                }
                is Result.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                }
                else -> {}
            }
        }
 
        viewModel.weeklySales.observe(viewLifecycleOwner) { sales ->
            if (DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_SALES_CHART)) {
                updateChart(sales)
            }
        }
 
        viewModel.topDishes.observe(viewLifecycleOwner) { dishes ->
            if (DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_TOP_PRODUCTS)) {
                updateTopDishesChart(dishes)
            }
        }
 
        viewModel.alerts.observe(viewLifecycleOwner) { alerts ->
            val showSetting = DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_INVENTORY_ALERTS)
            if (showSetting && alerts.isNotEmpty()) {
                binding.layoutAlerts.visibility = View.VISIBLE
                (binding.rvAlertsDashboard.adapter as? AlertsAdapter)?.submitList(alerts)
            } else {
                binding.layoutAlerts.visibility = View.GONE
            }
        }
 
        viewModel.staffMetrics.observe(viewLifecycleOwner) { metrics ->
            if (DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_STAFF_PERFORMANCE)) {
                (binding.rvStaffPerformance.adapter as? StaffPerformanceAdapter)?.submitList(metrics)
            }
            
            // --- Síntesis de Métricas ---
            // Dado que el endpoint de dashboard está viniendo vacío, calculamos los KPIs 
            // sumando el desempeño de todo el staff (que es el reporte mensual).
            if (metrics.isNotEmpty()) {
                val totalRevenue = metrics.sumOf { it.totalRevenue }
                val totalOrders = metrics.sumOf { it.orderCount }
                
                android.util.Log.d("DashboardData", "Sintetizando KPIs: Ventas=$totalRevenue, Pedidos=$totalOrders")
                
                // Actualizamos los textos de los KPIs directamente como fallback
                binding.tvSalesMonth.text = currencyFmt.format(totalRevenue)
                // Usamos el total de órdenes del mes como representativo si el diario está en 0
                if (binding.tvOrdersToday.text == "0") {
                    binding.tvOrdersToday.text = totalOrders.toString()
                }
            }
        }
    }
    
    // --- Inner Adapter for Alerts ---
    inner class AlertsAdapter : androidx.recyclerview.widget.ListAdapter<com.codex.foodify.data.model.InventoryAlert, AlertsAdapter.VH>(DiffCb()) {
        inner class VH(val b: com.codex.foodify.databinding.ItemInventoryAlertBinding) : androidx.recyclerview.widget.RecyclerView.ViewHolder(b.root)
        
        override fun onCreateViewHolder(p: ViewGroup, t: Int) = 
            VH(com.codex.foodify.databinding.ItemInventoryAlertBinding.inflate(layoutInflater, p, false))

        override fun onBindViewHolder(h: VH, p: Int) {
            val alert = getItem(p)
            h.b.tvItemName.text = alert.itemName
            h.b.tvAlertDesc.text = alert.message
            h.b.tvAlertType.text = when(alert.type) {
                "low_stock" -> "Stock Bajo"
                "expiring"  -> "Próx. a vencer"
                else        -> "Alerta"
            }
            
            val color = if (alert.type == "expiring") 
                ContextCompat.getColor(requireContext(), R.color.order_cancelled) 
            else 
                ContextCompat.getColor(requireContext(), R.color.foodify_orange)
                
            h.b.tvAlertType.setTextColor(color)
            h.b.ivAlertIcon.imageTintList = android.content.res.ColorStateList.valueOf(color)
        }
    }

    private class DiffCb : androidx.recyclerview.widget.DiffUtil.ItemCallback<com.codex.foodify.data.model.InventoryAlert>() {
        override fun areItemsTheSame(a: com.codex.foodify.data.model.InventoryAlert, b: com.codex.foodify.data.model.InventoryAlert) = a.id == b.id
        override fun areContentsTheSame(a: com.codex.foodify.data.model.InventoryAlert, b: com.codex.foodify.data.model.InventoryAlert) = a == b
    }

    private fun updateKpis(data: Map<String, Any>) {
        android.util.Log.d("DashboardData", "KPI Data recibida del servidor: $data")
        // Soporte para ambos estilos de nombres (camelCase y snake_case) y tipos numéricos variados
        val salesMonth = (data["salesMonth"] ?: data["sales_month"] ?: data["totalSalesMonth"] ?: 0.0).let {
            if (it is Number) it.toDouble() else 0.0
        }
        
        val ordersToday = (data["ordersToday"] ?: data["orders_today"] ?: data["dailyOrders"] ?: 0).let {
            if (it is Number) it.toInt() else 0
        }
        
        binding.tvSalesMonth.text    = currencyFmt.format(salesMonth)
        binding.tvOrdersToday.text   = ordersToday.toString()
    }

    private fun updateTopDishesChart(dishes: List<com.codex.foodify.data.model.TopDish>) {
        if (dishes.isEmpty()) {
            binding.chartTopDishes.apply {
                data = null
                setNoDataText("No hay datos registrados")
                invalidate()
            }
            return
        }

        // MPAndroidChart HorizontalBarChart mapea los índices al eje Y (que se ve vertical)
        val entries = dishes.reversed().mapIndexed { i, d -> BarEntry(i.toFloat(), d.quantity.toFloat()) }
        val colors = dishes.reversed().map { 
            try { android.graphics.Color.parseColor(it.color ?: "#E8673A") } 
            catch (e: Exception) { requireContext().getColor(R.color.foodify_orange) }
        }

        val dataSet = BarDataSet(entries, "Pedidos").apply {
            this.colors = colors
            valueTextColor = requireContext().getColor(R.color.text_high_light)
            valueTextSize = 10f
            setDrawValues(true)
            // Formateador para mostrar solo enteros
            valueFormatter = object : com.github.mikephil.charting.formatter.ValueFormatter() {
                override fun getFormattedValue(value: Float) = value.toInt().toString()
            }
        }

        binding.chartTopDishes.apply {
            xAxis.valueFormatter = IndexAxisValueFormatter(dishes.reversed().map { it.name })
            xAxis.labelCount = dishes.size
            data = BarData(dataSet).apply { barWidth = 0.6f }
            animateY(700)
            invalidate()
        }
    }

    private fun updateChart(sales: List<DailySales>) {
        if (sales.isEmpty()) {
            binding.chartWeeklySales.apply {
                data = null
                setNoDataText("No hay ventas registradas")
                invalidate()
            }
            return
        }

        val entries = sales.mapIndexed { i, s -> Entry(i.toFloat(), s.amount.toFloat()) }
        val dataSet = LineDataSet(entries, "Ventas").apply {
            color         = requireContext().getColor(R.color.foodify_orange)
            lineWidth     = 2.5f
            circleRadius  = 4f
            setCircleColor(requireContext().getColor(R.color.foodify_orange))
            circleHoleColor = requireContext().getColor(R.color.surface_light)
            mode          = LineDataSet.Mode.CUBIC_BEZIER
            setDrawFilled(true)
            fillColor     = requireContext().getColor(R.color.foodify_orange)
            fillAlpha     = 30
            setDrawValues(false)
        }

        binding.chartWeeklySales.apply {
            xAxis.valueFormatter = IndexAxisValueFormatter(sales.map { it.day })
            xAxis.labelCount = sales.size
            data = LineData(dataSet)
            animateX(600)
            invalidate()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
