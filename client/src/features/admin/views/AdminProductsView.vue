<template>
  <AdminDashboardShell subtitle="Manage audiences, product types, pricing, and publish states.">
    <AdminToastStack :toasts="toasts" @close="removeToast" />

    <div class="row g-3 mt-2">
      <div class="col-6 col-lg-3">
        <div class="metric-card">
          <div class="metric-label">Total Products</div>
          <div class="metric-value">{{ meta.total || 0 }}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="metric-card">
          <div class="metric-label">Active on Page</div>
          <div class="metric-value">{{ activeOnPage }}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="metric-card">
          <div class="metric-label">Inactive on Page</div>
          <div class="metric-value">{{ inactiveOnPage }}</div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="metric-card">
          <div class="metric-label">Active Types</div>
          <div class="metric-value">{{ activeTypeCount }}</div>
        </div>
      </div>
    </div>

    <div v-if="catalogTab === 'create-type'" class="mt-3">
      <div class="admin-panel-card admin-table-card p-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h3 class="h6 mb-0">Types</h3>
          <button class="btn btn-sm admin-cta-btn" @click="openCreateTypeModal">Create Type</button>
        </div>

        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in categories" :key="c.id">
                <td>
                  <div class="fw-semibold">{{ c.name }}</div>
                  <div class="small text-muted">{{ c.slug }}</div>
                </td>
                <td>
                  <span class="badge border" :class="c.is_active ? 'text-bg-light' : 'text-bg-secondary'">
                    {{ c.is_active ? 'active' : 'inactive' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-dark" @click="editType(c)">Edit</button>
                    <button class="btn btn-outline-danger" @click="disableType(c)" :disabled="!c.is_active">Disable</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="typeModalOpen" class="admin-type-modal-backdrop" @click.self="closeTypeModal">
        <div class="admin-type-modal">
          <div class="admin-type-modal-header">
            <h4 class="h6 mb-0">{{ editingTypeId ? 'Edit Type' : 'Create Type' }}</h4>
            <button class="modal-close-btn" type="button" aria-label="Close" @click="closeTypeModal">&times;</button>
          </div>
          <div class="admin-type-modal-body d-flex flex-column gap-2">
            <div>
              <label class="form-label mb-1">Type Name <span class="required-mark">*</span></label>
              <input class="form-control" v-model="typeForm.name" placeholder="e.g. Dresses" required />
            </div>
            <div>
              <label class="form-label mb-1">Slug (Optional)</label>
              <input class="form-control" v-model="typeForm.slug" placeholder="e.g. dresses" />
            </div>
            <div>
              <label class="form-label mb-1">Sort Order</label>
              <input class="form-control" v-model.number="typeForm.sort_order" type="number" min="0" />
            </div>
            <div class="form-check mt-1">
              <input class="form-check-input" id="type-active" type="checkbox" v-model="typeForm.is_active" />
              <label class="form-check-label" for="type-active">Active</label>
            </div>
          </div>
          <div class="admin-type-modal-footer">
            <button class="btn btn-outline-dark btn-sm" @click="closeTypeModal">Cancel</button>
            <button class="btn btn-sm admin-cta-btn" @click="saveType">{{ editingTypeId ? 'Update' : 'Create' }} Type</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="catalogTab === 'create-product'" class="mt-3">
      <div class="admin-panel-card admin-table-card p-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h3 class="h6 mb-0">{{ editingProductId ? 'Edit Product' : 'Create Product' }}</h3>
          <button v-if="editingProductId" class="btn btn-outline-dark btn-sm" @click="openNewProduct">New Product</button>
        </div>

        <div class="mt-3 p-3 border rounded-3 bg-light-subtle">
          <div class="row g-2">
            <div class="col-md-6">
              <label class="form-label mb-1">Title <span class="required-mark">*</span></label>
              <input class="form-control" v-model="productForm.title" placeholder="Product title" required />
            </div>
            <div class="col-md-6">
              <label class="form-label mb-1">Slug <span class="required-mark">*</span></label>
              <input class="form-control" v-model="productForm.slug" placeholder="product-slug" required />
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1">Audience <span class="required-mark">*</span></label>
              <select class="form-select" v-model="productForm.gender" required>
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1">Type <span class="required-mark">*</span></label>
              <select class="form-select" v-model="productForm.category_id" required>
                <option value="">Select type</option>
                <option v-for="c in categories.filter((x) => x.is_active)" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label mb-1">Base Price <span class="required-mark">*</span></label>
              <input class="form-control" v-model.number="productForm.base_price" type="number" min="0" step="0.01" placeholder="$" required @input="onBasePriceInput" />
            </div>
            <div class="col-md-2">
              <label class="form-label mb-1">Discount Price</label>
              <input class="form-control" v-model.number="productForm.discount_price" type="number" min="0" step="0.01" placeholder="$" @input="onDiscountPriceInput" />
            </div>
            <div class="col-md-2">
              <label class="form-label mb-1">Discount %</label>
              <input class="form-control" v-model.number="productForm.discount_percent" type="number" min="0" max="100" step="0.01" placeholder="%" @input="onDiscountPercentInput" />
            </div>
            <div class="col-md-6">
              <label class="form-label mb-1">Brand</label>
              <input class="form-control" v-model="productForm.brand" placeholder="Brand name" />
            </div>
            <div class="col-md-6">
              <label class="form-label mb-1">Parent SKU</label>
              <input class="form-control" v-model="productForm.parent_sku" placeholder="Parent SKU" />
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1">Material</label>
              <input class="form-control" v-model="productForm.material" placeholder="e.g. Cotton blend" />
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1">Fit</label>
              <input class="form-control" v-model="productForm.fit" placeholder="e.g. Regular fit" />
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1">Size Guide</label>
              <input class="form-control" v-model="productForm.size_guide" placeholder="URL or short note" />
            </div>
            <div class="col-12">
              <label class="form-label mb-1">Care Instructions</label>
              <textarea class="form-control" v-model="productForm.care" rows="2" placeholder="Wash care / fabric care"></textarea>
            </div>
            <div class="col-12">
              <label class="form-label mb-1">Model Note</label>
              <input class="form-control" v-model="productForm.model_note" placeholder="e.g. Model is 175cm and wears M" />
            </div>
            <div class="col-12">
              <label class="form-label mb-1">Style Tags</label>
              <input class="form-control" v-model="productForm.style_tags" placeholder="casual, office, summer" />
            </div>
            <div class="col-md-6">
              <label class="form-label mb-1">Meta Title</label>
              <input class="form-control" v-model="productForm.meta_title" placeholder="SEO title" />
            </div>
            <div class="col-md-6">
              <label class="form-label mb-1">Meta Description</label>
              <input class="form-control" v-model="productForm.meta_description" placeholder="SEO description" />
            </div>
            <div class="col-12">
              <label class="form-label mb-1">Description</label>
              <textarea class="form-control" v-model="productForm.description" rows="2" placeholder="Description"></textarea>
            </div>

            <div class="col-12 mt-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">Images <span class="required-mark">*</span></label>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-dark" type="button" :disabled="imageUploading" @click="triggerImageUpload">
                    {{ imageUploading ? 'Uploading...' : 'Upload Images' }}
                  </button>
                  <button class="btn btn-sm btn-outline-dark" type="button" @click="addImageRow">Add URL</button>
                </div>
              </div>
              <div v-if="imageUploading" class="upload-progress-wrap mb-2">
                <div class="small text-muted mb-1">Uploading images... {{ imageUploadProgress }}%</div>
                <div class="progress" role="progressbar" aria-label="Image upload progress" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="imageUploadProgress">
                  <div class="progress-bar bg-primary" :style="{ width: `${imageUploadProgress}%` }"></div>
                </div>
              </div>

              <div v-if="pendingUploadPreviews.length" class="preview-image-grid mb-2">
                <div v-for="p in pendingUploadPreviews" :key="p.id" class="preview-thumb-card">
                  <img :src="p.url" :alt="p.name" class="preview-image" />
                  <div class="preview-caption">{{ p.name }}</div>
                </div>
              </div>

              <div v-else-if="imagePreviewUrls.length" class="preview-image-grid mb-2">
                <img
                  v-for="(url, idx) in imagePreviewUrls"
                  :key="`preview-${idx}-${url}`"
                  :src="url"
                  alt="Product image preview"
                  class="preview-image"
                />
              </div>

              <input
                ref="imageFileInput"
                class="d-none"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                @change="onImageFilesSelected"
              />
              <div v-for="(image, index) in productForm.images" :key="`img-${index}`" class="row g-2 mb-2">
                <div class="col-md-7">
                  <input class="form-control" v-model="image.url" placeholder="Image URL" :required="index === 0" />
                </div>
                <div class="col-md-4">
                  <input class="form-control" v-model="image.alt_text" placeholder="Alt text (optional)" />
                </div>
                <div class="col-md-1 d-grid">
                  <button class="btn btn-outline-danger" type="button" @click="removeImageRow(index)" :disabled="productForm.images.length <= 1">×</button>
                </div>
              </div>
            </div>

            <div class="col-12 mt-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">Variants (Size/Color/SKU/Stock) <span class="required-mark">*</span></label>
                <button class="btn btn-sm btn-outline-dark" type="button" @click="addVariantRow">Add Variant</button>
              </div>
              <div v-for="(variant, index) in productForm.variants" :key="`variant-${index}`" class="row g-2 mb-2">
                <div class="col-md-3">
                  <input class="form-control" v-model="variant.size" placeholder="Size (S, M, L)" :required="index === 0" />
                </div>
                <div class="col-md-3">
                  <input class="form-control" v-model="variant.color" placeholder="Color" :required="index === 0" />
                </div>
                <div class="col-md-3">
                  <input class="form-control" v-model="variant.sku" placeholder="Variant SKU" />
                </div>
                <div class="col-md-2">
                  <input class="form-control" v-model.number="variant.stock" type="number" min="0" placeholder="Stock" />
                </div>
                <div class="col-md-1 d-grid">
                  <button class="btn btn-outline-danger" type="button" @click="removeVariantRow(index)" :disabled="productForm.variants.length <= 1">×</button>
                </div>
              </div>
            </div>

            <div class="col-12 d-flex justify-content-between align-items-center">
              <div class="form-check">
                <input class="form-check-input" id="product-active" type="checkbox" v-model="productForm.is_active" />
                <label class="form-check-label" for="product-active">Active</label>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm admin-cta-btn" @click="saveProduct">{{ editingProductId ? 'Update' : 'Create' }} Product</button>
                <button v-if="editingProductId" class="btn btn-outline-dark btn-sm" @click="resetProductForm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mt-3">
      <div class="admin-panel-card admin-table-card p-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h3 class="h6 mb-0">Products</h3>
          <button class="btn btn-sm admin-cta-btn" @click="openNewProduct">Create Product</button>
        </div>

        <div class="row g-2 mt-2">
          <div class="col-md-4">
            <input class="form-control" v-model="q" placeholder="Search title..." @keyup.enter="onFiltersChange" />
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="genderFilter" @change="onFiltersChange">
              <option value="">All audience</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" v-model="typeFilter" @change="onFiltersChange">
              <option value="">All types</option>
              <option v-for="c in categories.filter((x) => x.is_active)" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" v-model="activeFilter" @change="onFiltersChange">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="text-muted py-4 text-center">Loading…</div>
        <div v-else class="table-responsive mt-3">
          <table class="table align-middle mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>Audience</th>
                <th>Type</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in products" :key="p.id">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <img :src="p.hero_image" class="rounded-3" style="width: 42px; height: 56px; object-fit: cover;" />
                    <div>
                      <div class="fw-semibold">{{ p.title }}</div>
                      <div class="small text-muted">{{ p.product_code || '-' }}</div>
                      <div class="small text-muted">{{ p.slug }}</div>
                    </div>
                  </div>
                </td>
                <td class="text-capitalize">{{ p.gender }}</td>
                <td>{{ p.category_name || p.category_slug || '-' }}</td>
                <td class="fw-semibold">${{ Number(p.discount_price || p.base_price).toFixed(2) }}</td>
                <td><span class="badge text-bg-light border">{{ p.total_stock }}</span></td>
                <td>
                  <span class="badge border" :class="p.is_active ? 'text-bg-light' : 'text-bg-secondary'">
                    {{ p.is_active ? 'active' : 'inactive' }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" @click="openProductPreview(p)">View</button>
                    <button class="btn btn-outline-dark" @click="editProduct(p)">Edit</button>
                    <button class="btn btn-outline-danger" @click="disableProduct(p)" :disabled="!p.is_active">Disable</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <AppPagination
          :model-value="page"
          :total-pages="meta.totalPages || 1"
          :loading="loading"
          active-class="admin-cta-btn"
          inactive-class="btn-outline-secondary"
          nav-class="btn-outline-dark"
          @update:modelValue="onPageChange"
        />
      </div>

      <div v-if="productPreviewOpen" class="admin-type-modal-backdrop" @click.self="closeProductPreview">
        <div class="admin-type-modal product-preview-modal">
          <div class="admin-type-modal-header">
            <h4 class="h6 mb-0">{{ productPreview?.title || 'Product Details' }}</h4>
            <button class="modal-close-btn" type="button" aria-label="Close" @click="closeProductPreview">&times;</button>
          </div>

          <div v-if="productPreviewLoading" class="admin-type-modal-body text-muted">Loading product details...</div>
          <div v-else-if="productPreview" class="admin-type-modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="small text-muted">Reference</div>
                <div class="fw-semibold">{{ productPreview.product_code || '-' }}</div>
              </div>
              <div class="col-md-6">
                <div class="small text-muted">Slug</div>
                <div class="fw-semibold">{{ productPreview.slug }}</div>
              </div>
              <div class="col-md-3">
                <div class="small text-muted">Audience</div>
                <div class="text-capitalize fw-semibold">{{ productPreview.gender }}</div>
              </div>
              <div class="col-md-3">
                <div class="small text-muted">Type</div>
                <div class="fw-semibold">{{ productPreview.category_name || productPreview.category_slug || '-' }}</div>
              </div>
              <div class="col-md-4">
                <div class="small text-muted">Base Price</div>
                <div class="fw-semibold">${{ Number(productPreview.base_price || 0).toFixed(2) }}</div>
              </div>
              <div class="col-md-4">
                <div class="small text-muted">Discount Price</div>
                <div class="fw-semibold">{{ productPreview.discount_price ? `$${Number(productPreview.discount_price).toFixed(2)}` : '-' }}</div>
              </div>
              <div class="col-md-4">
                <div class="small text-muted">Status</div>
                <span class="badge border" :class="productPreview.is_active ? 'text-bg-light' : 'text-bg-secondary'">
                  {{ productPreview.is_active ? 'active' : 'inactive' }}
                </span>
              </div>
              <div class="col-12">
                <div class="small text-muted">Description</div>
                <div>{{ productPreview.description || '-' }}</div>
              </div>

              <div class="col-12">
                <div class="small text-muted mb-1">Images</div>
                <div v-if="Array.isArray(productPreview.images) && productPreview.images.length" class="preview-image-grid">
                  <img
                    v-for="img in productPreview.images"
                    :key="img.id || img.url"
                    :src="img.url"
                    :alt="img.alt_text || productPreview.title"
                    class="preview-image"
                  />
                </div>
                <div v-else class="text-muted">No images.</div>
              </div>

              <div class="col-12">
                <div class="small text-muted mb-1">Variants</div>
                <div v-if="Array.isArray(productPreview.variants) && productPreview.variants.length" class="table-responsive">
                  <table class="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Color</th>
                        <th>SKU</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="v in productPreview.variants" :key="v.id || `${v.size}-${v.color}-${v.sku}`">
                        <td>{{ v.size }}</td>
                        <td>{{ v.color }}</td>
                        <td>{{ v.sku || '-' }}</td>
                        <td>{{ v.stock }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="text-muted">No variants.</div>
              </div>
            </div>
          </div>

          <div class="admin-type-modal-footer">
            <button class="btn btn-outline-dark btn-sm" @click="closeProductPreview">Close</button>
          </div>
        </div>
      </div>
    </div>
  </AdminDashboardShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createAdminCategory,
  createAdminProduct,
  disableAdminCategory,
  disableAdminProduct,
  fetchAdminCategories,
  fetchAdminProduct,
  fetchAdminProducts,
  updateAdminCategory,
  updateAdminProduct,
  uploadProductImages,
} from '@/features/admin/api/adminProductsApi'
import AdminDashboardShell from '@/features/admin/components/AdminDashboardShell.vue'
import AdminToastStack from '@/features/admin/components/AdminToastStack.vue'
import AppPagination from '@/shared/components/common/AppPagination.vue'
import { useToast } from '@/shared/composables/useToast'
import {
  buildProductPayload,
  createEmptyProductForm,
  emptyImage,
  emptyVariant,
  productToForm,
  round2,
} from '@/features/admin/utils/adminProductForms'

const router = useRouter()
const route = useRoute()
const { toasts, success, error, removeToast } = useToast()

const loading = ref(false)
const imageUploading = ref(false)
const imageUploadProgress = ref(0)
const imageFileInput = ref(null)
const pendingUploadPreviews = ref([])

const categories = ref([])
const products = ref([])
const productPreviewOpen = ref(false)
const productPreviewLoading = ref(false)
const productPreview = ref(null)
const meta = ref({ page: 1, totalPages: 1 })
const page = ref(1)

const q = ref('')
const genderFilter = ref('')
const typeFilter = ref('')
const activeFilter = ref('')
const catalogTab = computed(() => {
  const raw = String(route.query.tab || 'view').toLowerCase()
  if (raw === 'products') return 'view'
  if (raw === 'types') return 'create-type'
  if (raw === 'create-product' || raw === 'create-type' || raw === 'view') return raw
  return 'view'
})

const editingTypeId = ref('')
const typeModalOpen = ref(false)
const typeForm = ref({
  name: '',
  slug: '',
  sort_order: 0,
  is_active: true,
})

const editingProductId = ref('')
const productForm = ref(createEmptyProductForm())

const activeTypeCount = computed(() => categories.value.filter((x) => x.is_active).length)
const activeOnPage = computed(() => products.value.filter((x) => x.is_active).length)
const inactiveOnPage = computed(() => products.value.filter((x) => !x.is_active).length)
const imagePreviewUrls = computed(() =>
  (productForm.value.images || [])
    .map((img) => String(img?.url || '').trim())
    .filter(Boolean)
)

function resetTypeForm() {
  editingTypeId.value = ''
  typeForm.value = { name: '', slug: '', sort_order: 0, is_active: true }
}

function openCreateTypeModal() {
  resetTypeForm()
  typeModalOpen.value = true
}

function closeTypeModal() {
  typeModalOpen.value = false
  resetTypeForm()
}

function resetProductForm() {
  editingProductId.value = ''
  productForm.value = createEmptyProductForm()
}

function addImageRow() {
  productForm.value.images.push(emptyImage(productForm.value.images.length))
}

function removeImageRow(index) {
  if (productForm.value.images.length <= 1) return
  productForm.value.images.splice(index, 1)
}

function triggerImageUpload() {
  imageFileInput.value?.click()
}

async function onImageFilesSelected(event) {
  const files = Array.from(event?.target?.files || [])
  if (!files.length) return

  pendingUploadPreviews.value.forEach((p) => URL.revokeObjectURL(p.url))
  pendingUploadPreviews.value = files.map((file, idx) => ({
    id: `${Date.now()}-${idx}`,
    name: file.name,
    url: URL.createObjectURL(file),
  }))

  imageUploading.value = true
  imageUploadProgress.value = 0
  try {
    const formData = new FormData()
    for (const file of files) formData.append('files', file)

    const uploaded = await uploadProductImages(
      formData,
      (progressEvent) => {
        const total = Number(progressEvent.total || 0)
        const loaded = Number(progressEvent.loaded || 0)
        if (total > 0) {
          imageUploadProgress.value = Math.max(1, Math.min(100, Math.round((loaded / total) * 100)))
        }
      }
    )
    if (!uploaded.length) {
      error('No images uploaded.')
      return
    }

    if (productForm.value.images.length === 1 && !String(productForm.value.images[0]?.url || '').trim()) {
      productForm.value.images = []
    }

    const baseIndex = productForm.value.images.length
    uploaded.forEach((item, index) => {
      productForm.value.images.push({
        url: item.url || '',
        alt_text: '',
        sort_order: baseIndex + index,
      })
    })
    imageUploadProgress.value = 100
    success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded.`)
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to upload images.')
  } finally {
    pendingUploadPreviews.value.forEach((p) => URL.revokeObjectURL(p.url))
    pendingUploadPreviews.value = []
    imageUploading.value = false
    imageUploadProgress.value = 0
    if (event?.target) event.target.value = ''
  }
}

function addVariantRow() {
  productForm.value.variants.push(emptyVariant())
}

function removeVariantRow(index) {
  if (productForm.value.variants.length <= 1) return
  productForm.value.variants.splice(index, 1)
}

function onDiscountPriceInput() {
  const base = Number(productForm.value.base_price)
  const discount = Number(productForm.value.discount_price)
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(discount) || discount <= 0 || discount >= base) {
    productForm.value.discount_percent = ''
    return
  }
  productForm.value.discount_percent = round2(((base - discount) / base) * 100)
}

function onBasePriceInput() {
  const percent = Number(productForm.value.discount_percent)
  if (Number.isFinite(percent) && percent > 0 && percent < 100) {
    onDiscountPercentInput()
    return
  }
  onDiscountPriceInput()
}

function onDiscountPercentInput() {
  const base = Number(productForm.value.base_price)
  const percent = Number(productForm.value.discount_percent)
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(percent) || percent <= 0 || percent >= 100) {
    return
  }
  productForm.value.discount_price = round2(base * (1 - percent / 100))
}

async function loadCategories() {
  categories.value = await fetchAdminCategories()
}

async function loadProducts() {
  loading.value = true
  try {
    const data = await fetchAdminProducts({
      page: page.value,
      limit: 10,
      q: q.value || undefined,
      gender: genderFilter.value || undefined,
      category_id: typeFilter.value || undefined,
      is_active: activeFilter.value || undefined,
    })
    products.value = data.items
    meta.value = data.meta
  } finally {
    loading.value = false
  }
}

async function loadAll() {
  try {
    await Promise.all([loadCategories(), loadProducts()])
  } catch (e) {
    router.push({ name: 'adminLogin' })
  }
}

async function saveType() {
  try {
    if (editingTypeId.value) {
      await updateAdminCategory(editingTypeId.value, typeForm.value)
      success('Type updated.')
    } else {
      await createAdminCategory(typeForm.value)
      success('Type created.')
    }
    typeModalOpen.value = false
    resetTypeForm()
    await loadCategories()
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to save type.')
  }
}

function editType(category) {
  editingTypeId.value = category.id
  typeForm.value = {
    name: category.name,
    slug: category.slug,
    sort_order: category.sort_order || 0,
    is_active: Boolean(category.is_active),
  }
  typeModalOpen.value = true
}

async function disableType(category) {
  try {
    await disableAdminCategory(category.id)
    success(`Type "${category.name}" disabled.`)
    await loadCategories()
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to disable type.')
  }
}

function openNewProduct() {
  resetProductForm()
  if (route.name === 'adminProducts') {
    router.push({ name: 'adminProducts', query: { tab: 'create-product' } })
  }
}

async function editProduct(product) {
  try {
    const full = await fetchAdminProduct(product.id) || product
    editingProductId.value = full.id
    productForm.value = productToForm(full)
    if (route.name === 'adminProducts') {
      router.push({ name: 'adminProducts', query: { tab: 'create-product' } })
    }
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to load product details.')
  }
}

async function saveProduct() {
  const payload = buildProductPayload(productForm.value)

  try {
    if (editingProductId.value) {
      await updateAdminProduct(editingProductId.value, payload)
      success('Product updated.')
    } else {
      await createAdminProduct(payload)
      success('Product created.')
    }
    resetProductForm()
    await loadProducts()
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to save product.')
  }
}

async function disableProduct(product) {
  try {
    await disableAdminProduct(product.id)
    success(`Product "${product.title}" disabled.`)
    await loadProducts()
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to disable product.')
  }
}

async function openProductPreview(product) {
  productPreviewOpen.value = true
  productPreviewLoading.value = true
  productPreview.value = null
  try {
    productPreview.value = await fetchAdminProduct(product.id)
  } catch (e) {
    productPreviewOpen.value = false
    error(e?.response?.data?.error || 'Failed to load product details.')
  } finally {
    productPreviewLoading.value = false
  }
}

function closeProductPreview() {
  productPreviewOpen.value = false
  productPreview.value = null
}

function onFiltersChange() {
  page.value = 1
  loadProducts()
}

function onPageChange(n) {
  if (!Number.isInteger(n) || n < 1 || n > Number(meta.value.totalPages || 1) || n === page.value) return
  page.value = n
  loadProducts()
}

onMounted(loadAll)
</script>

<style scoped>
.metric-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.9rem;
  padding: 0.9rem 1rem;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
}

.metric-label {
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 600;
}

.metric-value {
  font-size: 1.65rem;
  line-height: 1.15;
  font-weight: 700;
  color: #0f172a;
  margin-top: 0.35rem;
}

.admin-cta-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: #ffffff;
  border: 1px solid #60a5fa;
  font-weight: 700;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 18px rgba(96, 165, 250, 0.28);
}

.admin-cta-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: #ffffff;
  border-color: #3b82f6;
}

.admin-cta-btn:disabled {
  opacity: 0.6;
  box-shadow: none;
}

.required-mark {
  color: #dc2626;
  font-weight: 700;
}

.admin-type-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.admin-type-modal {
  width: min(560px, 100%);
  max-height: calc(100vh - 2rem);
  background: #ffffff;
  border: 1px solid #dbe3f0;
  border-radius: 1rem;
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-preview-modal {
  width: min(900px, 96vw);
}

.preview-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.preview-thumb-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #ffffff;
}

.preview-image {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 0.6rem;
  border: 1px solid #e2e8f0;
}

.preview-caption {
  padding: 0.35rem 0.45rem;
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-progress-wrap .progress {
  height: 0.45rem;
}

.admin-type-modal-header,
.admin-type-modal-footer {
  padding: 0.9rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: #f8fafc;
}

.modal-close-btn {
  border: 0;
  background: transparent;
  color: #475569;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.admin-type-modal-body {
  padding: 1rem;
  overflow-y: auto;
  min-height: 0;
}

.admin-type-modal-footer {
  justify-content: flex-end;
}

</style>
