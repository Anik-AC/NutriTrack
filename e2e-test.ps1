$BASE    = "http://localhost:5000"
$TOKEN   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTY5YjVmOWRmYjUyMzUxNjA3ZjRmMyIsImVtYWlsIjoiZHJpdmVzcGFjZXQxQGdtYWlsLmNvbSIsInVzZXJUeXBlIjoiY3VzdG9tZXIiLCJpYXQiOjE3ODEwNjc5ODAsImV4cCI6MTc4MTA3MTU4MH0.gYpIGPdubeSSOaiiXtaN_DAQ8Iwap7_mkwejiYsQw6Y"
$USER_ID = "6a169b5f9dfb52351607f4f3"

$pass = 0; $fail = 0; $skip = 0
$failures = [System.Collections.Generic.List[string]]::new()

function Req {
    param([string]$method, [string]$path, $body = $null, [bool]$auth = $true)
    $headers = @{ "Content-Type" = "application/json" }
    if ($auth) { $headers["Authorization"] = "Bearer $TOKEN" }
    $uri = "$BASE$path"
    try {
        $params = @{ Method = $method; Uri = $uri; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 20 }
        if ($null -ne $body) { $params["Body"] = ($body | ConvertTo-Json -Depth 10) }
        $r = Invoke-WebRequest @params
        return @{ ok = $true; status = [int]$r.StatusCode; data = ($r.Content | ConvertFrom-Json) }
    } catch {
        $status = 0; $data = $null
        try { $status = [int]$_.Exception.Response.StatusCode.value__ } catch {}
        try { $data = $_.ErrorDetails.Message | ConvertFrom-Json } catch { $data = $_.ErrorDetails.Message }
        return @{ ok = ($status -ge 200 -and $status -lt 300); status = $status; data = $data }
    }
}

function Pass { param([string]$name, [int]$s)
    $script:pass++
    Write-Host "  [PASS] $name (HTTP $s)" -ForegroundColor Green
}

function Fail { param([string]$name, [int]$s, [int]$exp, [string]$extra = "")
    $script:fail++
    $msg = "  [FAIL] $name  got=$s  expected=$exp  $extra"
    Write-Host $msg -ForegroundColor Red
    $script:failures.Add($msg)
}

function Check {
    param([string]$name, $res, [int]$exp, [scriptblock]$assert = $null)
    if ($res.status -ne $exp) {
        $extra = if ($res.data) { ($res.data | ConvertTo-Json -Compress -Depth 3) } else { "" }
        Fail $name $res.status $exp $extra
        return
    }
    if ($null -ne $assert) {
        $ok = $false
        try { $ok = (& $assert $res.data) -eq $true } catch {}
        if (-not $ok) { Fail $name $res.status $exp "(assertion failed)"; return }
    }
    Pass $name $res.status
}

function Skip { param([string]$name, [string]$reason)
    $script:skip++
    Write-Host "  [SKIP] $name  ($reason)" -ForegroundColor Yellow
}

function Section { param([string]$title)
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

# -----------------------------------------------------------------------
Section "HEALTH"

$r = Req GET "/api/health" -auth $false
Check "GET /api/health" $r 200 { $args[0].success -eq $true }

$r = Req GET "/api/v1/health" -auth $false
Check "GET /api/v1/health" $r 200 { $args[0].success -eq $true }

# -----------------------------------------------------------------------
Section "AUTH"

$r = Req GET "/api/user/profile"
Check "GET /api/user/profile (token valid)" $r 200

$r = Req POST "/api/auth/refresh-token" -auth $false
Check "POST /api/auth/refresh-token (no token -> 401)" $r 401

Skip "POST /api/auth/register" "would create duplicate user"
Skip "POST /api/auth/forgot-password" "sends real email"
Skip "POST /api/auth/generate-otp" "sends real email"
Skip "POST /api/auth/google/*" "OAuth - skipped by request"

# -----------------------------------------------------------------------
Section "USER PROFILE"

$r = Req GET "/api/user/profile"
Check "GET /api/user/profile" $r 200 { $args[0].name -ne $null -or $args[0].success -eq $true -or $args[0].data -ne $null }

$r = Req POST "/api/user/profile/setup" @{ name = "Anik Chakraborti"; weight = 69; height = 175; age = 27; gender = "male"; activityLevel = "moderate" }
Check "POST /api/user/profile/setup (update profile)" $r 200 { $args[0].success -eq $true }

Skip "POST /api/user/avatar" "file upload - requires multipart/form-data"

# -----------------------------------------------------------------------
Section "LEGACY FOOD TRACKING"

$today = (Get-Date -Format "yyyy-MM-dd")

$legacyTrack = @{
    userId      = $USER_ID
    foodName    = "E2E Banana"
    details     = @{ calories = 89; protein = 1.1; carbohydrates = 23; fat = 0.3; fiber = 2.6 }
    quantity    = 1
    servingUnit = "medium"
    eatenWhen   = "breakfast"
    eatenDate   = $today
}
$r = Req POST "/api/track" $legacyTrack
Check "POST /api/track (legacy format)" $r 201 { $args[0].success -eq $true }

$unifiedTrack = @{
    userId      = $USER_ID
    name        = "E2E Chicken Breast"
    nutrients   = @{ calories = 165; protein = 31; carbs = 0; fat = 3.6 }
    servingSize = 100
    servingUnit = "g"
    quantity    = 1
    eatenWhen   = "lunch"
    eatenDate   = $today
    source      = "usda"
    sourceId    = "e2e-usda-001"
}
$r = Req POST "/api/track" $unifiedTrack
Check "POST /api/track (UnifiedFoodItem format)" $r 201 { $args[0].success -eq $true }

$r = Req GET "/api/mealsConsumed"
Check "GET /api/mealsConsumed" $r 200 { $args[0].success -eq $true -and $args[0].data -ne $null }
if ($r.ok -and $r.data.data) {
    $meals = @($r.data.data)
    $banana  = $meals | Where-Object { $_.foodName -like "*Banana*" }
    $chicken = $meals | Where-Object { $_.foodName -like "*Chicken*" }
    $wsrc    = $meals | Where-Object { $_.source -ne $null }
    if ($banana)  { Write-Host "         + Legacy entry (Banana) found" -ForegroundColor DarkGreen }
    if ($chicken) { Write-Host "         + Unified entry (Chicken) found, source=$($chicken[0].source)" -ForegroundColor DarkGreen }
    if ($wsrc)    { Write-Host "         + source field on $($wsrc.Count) meal(s)" -ForegroundColor DarkGreen }
}

$customFood = @{
    userId               = $USER_ID
    foodName             = "E2E Protein Bar"
    details              = @{ calories = 220; protein = 20; carbohydrates = 25; fat = 7 }
    serving_unit         = "bar"
    serving_weight_grams = 60
}
$r = Req POST "/api/customFood" $customFood
Check "POST /api/customFood" $r 201 { $args[0].success -eq $true }
$cfId = if ($r.ok -and $r.data.data._id) { $r.data.data._id } else { $null }

$r = Req GET "/api/getCustomFood"
Check "GET /api/getCustomFood" $r 200 { $args[0].success -eq $true }

if ($cfId) {
    $r = Req PUT "/api/updateCustomFood/$cfId" @{ foodName = "E2E Protein Bar Updated"; details = @{ calories = 230; protein = 22; carbohydrates = 24; fat = 7 }; serving_unit = "bar"; serving_weight_grams = 60 }
    Check "PUT /api/updateCustomFood/:id" $r 200 { $args[0].success -eq $true }
    $r = Req DELETE "/api/deleteCustomFood/$cfId"
    Check "DELETE /api/deleteCustomFood/:id" $r 200 { $args[0].success -eq $true }
} else {
    Skip "PUT /api/updateCustomFood/:id" "no ID from create"
    Skip "DELETE /api/deleteCustomFood/:id" "no ID from create"
}

# -----------------------------------------------------------------------
Section "NUTRITION API v1 (Phase 1)"

$r = Req GET "/api/v1/nutrition/search?q=chicken+breast"
Check "GET /api/v1/nutrition/search?q=chicken" $r 200 { $args[0].success -eq $true }
$firstFoodId = $null
if ($r.ok -and $r.data.data.results) {
    $cnt = $r.data.data.results.Count
    $srcs = ($r.data.data.results | Select-Object -ExpandProperty source -Unique) -join ", "
    Write-Host "         + $cnt result(s), sources: $srcs" -ForegroundColor DarkGreen
    $firstFoodId = if ($r.data.data.results[0]._id) { $r.data.data.results[0]._id } else { $null }
}

$r = Req GET "/api/v1/nutrition/search"
Check "GET /api/v1/nutrition/search (no q -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

$r = Req GET "/api/v1/nutrition/barcode/737628064502"
if ($r.status -eq 200) {
    Check "GET /api/v1/nutrition/barcode/:code" $r 200 { $args[0].success -eq $true }
    Write-Host "         + Found: $($r.data.data.name)" -ForegroundColor DarkGreen
    # Second call hits the cache and returns a MongoDB document with _id
    $r2 = Req GET "/api/v1/nutrition/barcode/737628064502"
    if ($r2.status -eq 200 -and $r2.data.data._id) {
        $firstFoodId = $r2.data.data._id
        Write-Host "         + Cached food _id: $firstFoodId" -ForegroundColor DarkGreen
    }
} else {
    Check "GET /api/v1/nutrition/barcode/:code (not found -> 404)" $r 404
}

$r = Req POST "/api/v1/nutrition/parse" @{ text = "100g chicken breast" }
if ($r.status -eq 200) {
    Check "POST /api/v1/nutrition/parse" $r 200 { $args[0].success -eq $true }
} else {
    Check "POST /api/v1/nutrition/parse (no Edamam key -> 404)" $r 404
}

if ($firstFoodId) {
    $r = Req GET "/api/v1/nutrition/food/$firstFoodId"
    Check "GET /api/v1/nutrition/food/:id" $r 200 { $args[0].success -eq $true }
} else {
    Skip "GET /api/v1/nutrition/food/:id" "no food ID available (barcode not in OpenFoodFacts)"
}

# -----------------------------------------------------------------------
Section "RECIPES v1 (Phase 2.1)"

$newRecipe = @{
    title    = "E2E Overnight Oats"
    servings = 2
    prepTime = 5
    cookTime = 0
    tags     = @("breakfast", "meal-prep")
    ingredients = @(
        @{ name = "Rolled oats"; quantity = 160; unit = "g" }
        @{ name = "Milk";        quantity = 400; unit = "ml" }
        @{ name = "Chia seeds";  quantity = 20;  unit = "g" }
    )
    instructions       = @("Mix oats and milk", "Add chia seeds", "Refrigerate overnight")
    nutrientsPerServing = @{ calories = 380; protein = 14; carbs = 58; fat = 9; fiber = 8 }
}
$r = Req POST "/api/v1/recipes" $newRecipe
Check "POST /api/v1/recipes" $r 201 { $args[0].success -eq $true -and $args[0].data._id -ne $null }
$recipeId = if ($r.ok -and $r.data.data._id) { $r.data.data._id } else { $null }

$r = Req POST "/api/v1/recipes" @{ servings = 2 }
Check "POST /api/v1/recipes (missing title -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

$r = Req GET "/api/v1/recipes"
Check "GET /api/v1/recipes" $r 200 { $args[0].data.total -ge 1 }
if ($r.ok) { Write-Host "         + total=$($r.data.data.total) pages=$($r.data.data.pages)" -ForegroundColor DarkGreen }

$r = Req GET "/api/v1/recipes?tags=breakfast"
Check "GET /api/v1/recipes?tags=breakfast" $r 200 { $args[0].success -eq $true }

$r = Req GET "/api/v1/recipes?search=oats"
Check "GET /api/v1/recipes?search=oats" $r 200 { $args[0].data.recipes.Count -ge 1 }

if ($recipeId) {
    $r = Req GET "/api/v1/recipes/$recipeId"
    Check "GET /api/v1/recipes/:id" $r 200 { $args[0].data._id -eq $recipeId }

    $r = Req PUT "/api/v1/recipes/$recipeId" @{ title = "E2E Overnight Oats v2"; servings = 2 }
    Check "PUT /api/v1/recipes/:id" $r 200 { $args[0].data.title -like "*v2*" }

    $r = Req PUT "/api/v1/recipes/$recipeId" @{ isFavorite = $true; servings = 2 }
    Check "PUT /api/v1/recipes/:id (toggle isFavorite)" $r 200 { $args[0].data.isFavorite -eq $true }

    $r = Req POST "/api/v1/recipes/$recipeId/log" @{ servings = 1; eatenWhen = "breakfast" }
    Check "POST /api/v1/recipes/:id/log" $r 200 { $args[0].data.logged -eq $true }

    $r = Req POST "/api/v1/recipes/$recipeId/log" @{ servings = 1; eatenWhen = "teatime" }
    Check "POST /api/v1/recipes/:id/log (bad eatenWhen -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

    $r = Req GET "/api/v1/recipes/000000000000000000000000"
    Check "GET /api/v1/recipes/:id (not found -> 404)" $r 404 { $args[0].error.code -eq "RECIPE_NOT_FOUND" }
}

$r = Req POST "/api/v1/recipes/import/url" @{ url = "https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/" }
if ($r.status -eq 200) {
    Check "POST /api/v1/recipes/import/url (allrecipes)" $r 200 { $args[0].data.title -ne $null }
    Write-Host "         + Parsed: $($r.data.data.title)" -ForegroundColor DarkGreen
} elseif ($r.status -eq 422) {
    Check "POST /api/v1/recipes/import/url (no JSON-LD -> 422)" $r 422
} elseif ($r.status -eq 502) {
    Check "POST /api/v1/recipes/import/url (fetch failed -> 502)" $r 502
} else {
    Check "POST /api/v1/recipes/import/url" $r 200
}

$r = Req POST "/api/v1/recipes/import/url" @{ url = "not-a-url" }
Check "POST /api/v1/recipes/import/url (bad URL -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

$r = Req POST "/api/v1/recipes/import/image"
Check "POST /api/v1/recipes/import/image (-> 501)" $r 501 { $args[0].error.code -eq "NOT_IMPLEMENTED" }

$r = Req POST "/api/v1/recipes/import/youtube" @{ url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
Check "POST /api/v1/recipes/import/youtube (-> 501)" $r 501 { $args[0].error.code -eq "NOT_IMPLEMENTED" }

if ($recipeId) {
    $r = Req DELETE "/api/v1/recipes/$recipeId"
    Check "DELETE /api/v1/recipes/:id" $r 200 { $args[0].data.id -ne $null }
    $r = Req GET "/api/v1/recipes/$recipeId"
    Check "GET /api/v1/recipes/:id after delete (-> 404)" $r 404
}

# -----------------------------------------------------------------------
Section "MEAL PLAN v1 (Phase 2.2)"

$planRecipe = Req POST "/api/v1/recipes" @{
    title    = "E2E Chicken Rice"
    servings = 1
    ingredients = @(
        @{ name = "Chicken breast"; quantity = 150; unit = "g" }
        @{ name = "White rice";     quantity = 100; unit = "g" }
    )
    instructions        = @("Cook chicken", "Cook rice", "Combine")
    nutrientsPerServing = @{ calories = 420; protein = 38; carbs = 40; fat = 8 }
}
$planRecipeId = if ($planRecipe.ok -and $planRecipe.data.data._id) { $planRecipe.data.data._id } else { $null }

$dow = [int](Get-Date).DayOfWeek
$daysBack = if ($dow -eq 0) { 6 } else { $dow - 1 }
$monday = (Get-Date).Date.AddDays(-$daysBack).ToString("yyyy-MM-dd")
Write-Host "         (current week start: $monday)" -ForegroundColor DarkGray

$planBody = @{
    weekStart = $monday
    days = @(
        @{
            date           = $monday
            meals          = @(
                @{ type = "breakfast"; recipeId = $planRecipeId; servings = 1 }
                @{ type = "lunch";     recipeId = $planRecipeId; servings = 2 }
            )
            targetCalories = 2000
            targetProtein  = 150
        }
    )
}
$r = Req POST "/api/v1/meal-plan" $planBody
Check "POST /api/v1/meal-plan (create/upsert)" $r 200 { $args[0].success -eq $true }
$planId = if ($r.ok -and $r.data.data._id) { $r.data.data._id } else { $null }

$r = Req POST "/api/v1/meal-plan" @{ days = @() }
Check "POST /api/v1/meal-plan (missing weekStart -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

$r = Req GET "/api/v1/meal-plan"
Check "GET /api/v1/meal-plan (current week)" $r 200 { $args[0].data.weekStart -ne $null }

$r = Req GET "/api/v1/meal-plan/week/$monday"
Check "GET /api/v1/meal-plan/week/:weekStart" $r 200 { $args[0].data._id -ne $null }

$r = Req GET "/api/v1/meal-plan/week/2001-01-01"
Check "GET /api/v1/meal-plan/week/:weekStart (old date -> 404)" $r 404 { $args[0].error.code -eq "MEAL_PLAN_NOT_FOUND" }

$r = Req GET "/api/v1/meal-plan/grocery-list"
Check "GET /api/v1/meal-plan/grocery-list" $r 200 { $args[0].success -eq $true }
if ($r.ok -and $r.data.data.categories) {
    $cats = $r.data.data.categories
    $total = ($cats | ForEach-Object { $_.items.Count } | Measure-Object -Sum).Sum
    Write-Host "         + $($cats.Count) categories, $total ingredient(s) total" -ForegroundColor DarkGreen
    foreach ($cat in $cats) {
        $items = ($cat.items | ForEach-Object { "$($_.name) $($_.quantity)$($_.unit)" }) -join ", "
        Write-Host "           $($cat.name): $items" -ForegroundColor DarkGray
    }
}

if ($planId) {
    $r = Req DELETE "/api/v1/meal-plan/$planId"
    Check "DELETE /api/v1/meal-plan/:id" $r 200 { $args[0].data.id -ne $null }
} else {
    Skip "DELETE /api/v1/meal-plan/:id" "no plan ID"
}

if ($planRecipeId) { Req DELETE "/api/v1/recipes/$planRecipeId" | Out-Null }

# -----------------------------------------------------------------------
Section "WATER INTAKE v1 (Phase 3)"

$r = Req PUT "/api/v1/water/goal" @{ dailyGoalMl = 2500 }
Check "PUT /api/v1/water/goal (set goal)" $r 200 { $args[0].data.dailyGoalMl -eq 2500 }

$r = Req PUT "/api/v1/water/goal" @{ dailyGoalMl = 499 }
Check "PUT /api/v1/water/goal (too low -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

$r = Req POST "/api/v1/water/log" @{ amount = 250; source = "quick_add" }
Check "POST /api/v1/water/log (250ml)" $r 201 { $args[0].data.log.amount -eq 250 -and $args[0].data.today.total -ge 250 }
$logId1 = if ($r.ok -and $r.data.data.log._id) { $r.data.data.log._id } else { $null }

$r = Req POST "/api/v1/water/log" @{ amount = 500 }
Check "POST /api/v1/water/log (500ml)" $r 201 { $args[0].data.today.total -ge 500 }

$r = Req POST "/api/v1/water/log" @{ amount = 0 }
Check "POST /api/v1/water/log (amount=0 -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

$r = Req POST "/api/v1/water/log" @{ amount = 99999 }
Check "POST /api/v1/water/log (too large -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

$r = Req GET "/api/v1/water/today"
Check "GET /api/v1/water/today" $r 200 { $args[0].data.total -ge 750 -and $args[0].data.goal -eq 2500 }
if ($r.ok) {
    Write-Host "         + total=$($r.data.data.total)ml / goal=$($r.data.data.goal)ml ($($r.data.data.percentage)%)" -ForegroundColor DarkGreen
}

$today = (Get-Date -Format "yyyy-MM-dd")
$sevenDaysAgo = (Get-Date).AddDays(-6).ToString("yyyy-MM-dd")
$r = Req GET "/api/v1/water/history?startDate=$sevenDaysAgo&endDate=$today"
Check "GET /api/v1/water/history (date range)" $r 200 { $null -ne $args[0].data.days }
if ($r.ok) {
    Write-Host "         + $($r.data.data.days.Count) day(s) with data" -ForegroundColor DarkGreen
}

$r = Req GET "/api/v1/water/history"
Check "GET /api/v1/water/history (default 7 days)" $r 200 { $null -ne $args[0].data.days }

$r = Req GET "/api/v1/water/history?startDate=not-a-date"
Check "GET /api/v1/water/history (bad date -> 400)" $r 400 { $args[0].error.code -eq "VALIDATION_ERROR" }

$r = Req GET "/api/v1/water/history?startDate=2026-06-10&endDate=2026-06-01"
Check "GET /api/v1/water/history (start > end -> 400)" $r 400 { $args[0].error.code -eq "INVALID_RANGE" }

if ($logId1) {
    $r = Req DELETE "/api/v1/water/log/$logId1"
    Check "DELETE /api/v1/water/log/:id" $r 200 { $args[0].data.id -ne $null }
} else {
    Skip "DELETE /api/v1/water/log/:id" "no log ID"
}

$r = Req DELETE "/api/v1/water/log/000000000000000000000000"
Check "DELETE /api/v1/water/log/:id (not found -> 404)" $r 404 { $args[0].error.code -eq "WATER_LOG_NOT_FOUND" }

# -----------------------------------------------------------------------
Section "SWAGGER DOCS"
$r = Req GET "/api/docs.json" -auth $false
Check "GET /api/docs.json" $r 200

# -----------------------------------------------------------------------
Write-Host "`n=======================================" -ForegroundColor Cyan
$color = if ($fail -eq 0) { "Green" } else { "Yellow" }
Write-Host "  RESULTS: $pass PASSED  |  $fail FAILED  |  $skip SKIPPED" -ForegroundColor $color
Write-Host "=======================================" -ForegroundColor Cyan

if ($fail -gt 0) {
    Write-Host "`nFailed:" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
}
