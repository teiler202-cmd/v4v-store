/**
 * 상품 옵션 / Variant 해석 헬퍼.
 *
 * 쇼피파이는 옵션이 없는 상품에도 'Title: Default Title' 옵션을 붙입니다.
 * 그걸 그대로 화면에 노출하거나 Variant 매칭에 쓰면
 * 존재하지 않는 선택지를 고르게 되고, 결국 variantId가 undefined인 채로
 * 장바구니에 담겨(=React key 경고 + 결제 실패) 문제가 생깁니다.
 */

export type SizeOption = { name: string; values: string[] } | null;

export function getSizeOption(product: any): SizeOption {
  const option = product?.options?.find(
    (opt: any) => opt?.name === 'Size' || opt?.name === 'Title'
  );
  if (!option) return null;

  const values = (option.values ?? []).filter((v: string) => v !== 'Default Title');
  return values.length ? { name: option.name, values } : null;
}

/** 선택한 옵션 값에 해당하는 Variant ID를 찾습니다. 못 찾으면 첫 Variant로 대체합니다. */
export function resolveVariantId(product: any, selectedValue?: string): string | null {
  const edges = product?.variants?.edges ?? [];
  if (!edges.length) return null;

  if (selectedValue) {
    const matched = edges.find(
      (edge: any) =>
        edge?.node?.selectedOptions?.some((opt: any) => opt?.value === selectedValue) ||
        edge?.node?.title === selectedValue
    );
    if (matched?.node?.id) return matched.node.id;
  }

  return edges[0]?.node?.id ?? null;
}

export function isVariantAvailable(product: any, selectedValue?: string): boolean {
  const edges = product?.variants?.edges ?? [];
  if (!edges.length) return true;

  const target = selectedValue
    ? edges.find(
        (edge: any) =>
          edge?.node?.selectedOptions?.some((opt: any) => opt?.value === selectedValue) ||
          edge?.node?.title === selectedValue
      )
    : edges[0];

  return target?.node?.availableForSale !== false;
}
