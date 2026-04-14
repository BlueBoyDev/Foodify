// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/QrScannerFragment.kt
// Escaneo QR Para Llevar — llama a PATCH /orders/:id/scan-qr (Solo Premium)
// Usa ZXing Embedded para la cámara
package com.codex.foodify.ui.cashier

import android.os.Bundle
import android.view.*
import androidx.fragment.app.viewModels
import com.codex.foodify.databinding.FragmentQrScannerBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class QrScannerFragment : BottomSheetDialogFragment() {

    private var _binding: FragmentQrScannerBinding? = null
    private val binding get() = _binding!!
    private val viewModel: CashierViewModel by viewModels()
    private var orderId: Int? = null // This orderId is for pre-filling, not for direct use in scanning flow
    private var scanning = true
    private var isFlashlightOn = false

    companion object {
        fun newInstance(orderId: Int?) = QrScannerFragment().apply {
            arguments = Bundle().apply {
                if (orderId != null) putInt("orderId", orderId)
            }
        }
    }

    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        // The orderId passed to newInstance is mainly for display purposes in the title
        // The actual orderId for scanning comes from the QR content or from the initial order context if applicable.
        // We don't directly use this orderId for `processQrScan` as the ViewModel handles parsing from qrContent.
        orderId = arguments?.getInt("orderId", -1)?.takeIf { it > 0 }
    }

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentQrScannerBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvScanTitle.text = if (orderId != null)
            "Escanear QR — Orden #$orderId" else "Escanear QR de Orden Para Llevar"

        // Callback del scanner ZXing
        val callback = object : BarcodeCallback {
            override fun barcodeResult(result: BarcodeResult) {
                if (!scanning) return
                scanning = false

                binding.tvScanResult.text = "✓ QR escaneado — procesando..."
                viewModel.processQrScan(
                    qrContent = result.text,
                    onValidationError = { message ->
                        binding.tvScanResult.text = "Error: $message"
                        scanning = true
                    },
                    onSuccess = { scanResponse, orderDto ->
                        binding.tvScanResult.text = "✓ Orden #${scanResponse.orderNumber} entregada — $${String.format("%.2f", scanResponse.total)}"
                        binding.barcodeView.pause()
                        // Optionally, trigger a refresh in CashierFragment if needed
                        (parentFragment as? CashierFragment)?.viewModel?.loadData()
                        view.postDelayed({ dismiss() }, 1500)
                    }
                )
            }
        }

        binding.barcodeView.decodeContinuous(callback)

        // Linterna
        binding.btnFlashlight.setOnClickListener {
            isFlashlightOn = !isFlashlightOn
            if (isFlashlightOn) {
                binding.barcodeView.setTorchOn()
            } else {
                binding.barcodeView.setTorchOff()
            }
        }

        binding.btnCancel.setOnClickListener { dismiss() }

        // Observe ViewModel's error and success messages
        viewModel.error.observe(viewLifecycleOwner) { message ->
            message?.let {
                binding.tvScanResult.text = "Error: $it"
                scanning = true
                binding.barcodeView.resume()
                viewModel.clearMessages() // Clear message after showing
            }
        }

        viewModel.successMsg.observe(viewLifecycleOwner) { message ->
            // The success message is handled by the onSuccess callback of processQrScan
            // However, if there are other success messages from the ViewModel, they can be displayed here.
            // For now, no specific action needed here as processQrScan's onSuccess is handling it.
        }
    }

    override fun onResume() {
        super.onResume()
        binding.barcodeView.resume()
        scanning = true // Reset scanning state on resume
    }

    override fun onPause() {
        super.onPause()
        binding.barcodeView.pause()
        if (isFlashlightOn) { // Turn off flashlight if on when fragment pauses
            binding.barcodeView.setTorchOff()
            isFlashlightOn = false
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
