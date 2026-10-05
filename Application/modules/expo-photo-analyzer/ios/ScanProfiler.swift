import Foundation

final class ScanProfiler {
    enum Stage: String, CaseIterable {
        case metadata
        case screenshot
        case livePhoto
        case thumbnail
        case pixelAnalysis
        case blur
        case content
        case face
        case quality
        case duplicates
    }

    static let shared = ScanProfiler()

    /// Leave disabled in production. Enable temporarily to identify real bottlenecks.
    var enabled = false

    private let lock = NSLock()
    private var totals: [Stage: Double] = [:]
    private var counts: [Stage: Int] = [:]

    @inline(__always)
    func measure<T>(_ stage: Stage, _ body: () -> T) -> T {
        guard enabled else {
            return body()
        }

        let start = CFAbsoluteTimeGetCurrent()
        let result = body()
        let elapsed = CFAbsoluteTimeGetCurrent() - start

        lock.lock()
        totals[stage, default: 0] += elapsed
        counts[stage, default: 0] += 1
        lock.unlock()

        return result
    }

    func reset() {
        lock.lock()
        totals.removeAll(keepingCapacity: true)
        counts.removeAll(keepingCapacity: true)
        lock.unlock()
    }

    func report() -> String {
        lock.lock()
        let snapshot = Stage.allCases.compactMap { stage -> (Stage, Double, Int)? in
            guard let total = totals[stage], let count = counts[stage], count > 0 else {
                return nil
            }
            return (stage, total, count)
        }
        lock.unlock()

        return snapshot.map { stage, total, count in
            let averageMs = total / Double(count) * 1000
            return String(
                format: "%-15@ %9.2fs %8d %9.2fms/call",
                stage.rawValue as NSString,
                total,
                count,
                averageMs
            )
        }.joined(separator: "\n")
    }
}
